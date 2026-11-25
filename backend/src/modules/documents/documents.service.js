// src/modules/documents/documents.service.js
// Documentos personales del cliente (tabla documento, opción 1 = cliente).
// El archivo se guarda con la misma ruta y el mismo registro que documento_model->adjunta_archivo
// del sistema actual: <YYYY>/<MM>/01_<cliente>_<tipo>.<ext> en S3 (o carpeta local en desarrollo).

import { pool } from "../../config/db.js";
import { AppError } from "../../utils/appError.js";
import { guardarArchivo, leerArchivo } from "../../utils/storage.js";

const hoy = () => new Date().toISOString().slice(0, 10);

const fechaISO = (value) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value).slice(0, 10);
  return s === "0000-00-00" ? "" : s;
};

/**
 * Estado de un documento con la misma regla que la vista form_documentacion.php:
 *  - faltante: no hay archivo
 *  - renovar:  hay archivo pero no está revisado/vigente o la vigencia venció
 *  - vigente:  revisado y con vigencia futura
 */
export const estadoDocumento = (doc) => {
  if (!doc) return "faltante";
  const fecha = fechaISO(doc.fecha_vigencia);
  const revisionVacia = !Number(doc.revision);
  const vigenteVacio = !Number(doc.vigente);
  if ((revisionVacia && vigenteVacio) || !fecha || fecha < hoy()) return "renovar";
  return "vigente";
};

/** Igual a documentoVigente() del helper PHP (se usa para saber si la INE sirve). */
export const documentoVigente = (doc) => {
  if (!doc) return false;
  const fecha = fechaISO(doc.fecha_vigencia);
  if (!fecha) return true;
  return fecha >= hoy() && Number(doc.revision) === 1;
};

/** Último documento activo por posición (getfiles() del modelo PHP). */
export const getDocumentosPorPosicion = async (cliente_id) => {
  const [rows] = await pool.query(
    `SELECT Id, posicion, Description, Mime, path, fecha_vigencia, revision, vigente, fecha_registro
       FROM documento
      WHERE cliente_id = ? AND Active = 1 AND (borrado <> 1 OR borrado IS NULL)
      ORDER BY Id ASC`,
    [cliente_id],
  );
  const map = {};
  for (const r of rows) map[Number(r.posicion)] = r;
  return map;
};

/** Lista de documentos requeridos (ids de catálogo) con su estado. */
export const getDocumentosRequeridos = async (cliente_id, idsCsv) => {
  const ids = String(idsCsv || "")
    .split(",")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (!ids.length) return [];

  const [catalogo] = await pool.query(
    `SELECT id, nombre, descripcion FROM catalogo WHERE id IN (?) ORDER BY pos ASC`,
    [ids],
  );
  const docs = await getDocumentosPorPosicion(cliente_id);

  return catalogo.map((c) => {
    const doc = docs[Number(c.id)];
    return {
      tipo: Number(c.id),
      nombre: c.nombre,
      descripcion: c.descripcion || null,
      estado: estadoDocumento(doc),
      documento_id: doc ? Number(doc.Id) : null,
      fecha_vigencia: doc ? fechaISO(doc.fecha_vigencia) || null : null,
    };
  });
};

const MIMES = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

/** Revisa la "firma" del archivo para que el contenido corresponda a la extensión. */
const contenidoValido = (buffer, ext) => {
  if (ext === "pdf") return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
  if (ext === "png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
};

export const subirDocumentoService = async ({ user, tipo, nombre, base64 }) => {
  const tipoNum = Number(tipo);
  if (!Number.isInteger(tipoNum) || tipoNum <= 0) throw new AppError("Tipo de documento inválido", 400);

  const [[tipoCat]] = await pool.query(
    "SELECT id, nombre FROM catalogo WHERE id = ? AND catalogo_tipo_id IN (7,8,29) LIMIT 1",
    [tipoNum],
  );
  if (!tipoCat) throw new AppError("Tipo de documento inválido", 400);

  const ext = String(nombre || "").split(".").pop().toLowerCase();
  if (!MIMES[ext]) throw new AppError("Solo se permiten archivos PDF, JPG o PNG", 400);

  const buffer = Buffer.from(String(base64 || "").replace(/^data:[^;]+;base64,/, ""), "base64");
  if (!buffer.length) throw new AppError("Archivo vacío", 400);
  if (buffer.length > 10 * 1024 * 1024) throw new AppError("El archivo no debe pesar más de 10 MB", 400);
  if (!contenidoValido(buffer, ext)) throw new AppError("El contenido del archivo no coincide con su tipo", 400);
  const inicio = buffer.subarray(0, 512).toString("latin1");
  if (inicio.includes("<?php") || inicio.includes("<?=")) throw new AppError("Archivo no permitido", 400);

  const clienteId = Number(user.cliente_id);
  const [anio, mes] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit" })
    .format(new Date())
    .split("-");
  const extension = ext;
  const ruta = `${anio}/${mes}/01_${clienteId}_${String(tipoNum).padStart(2, "0")}.${extension}`;

  await guardarArchivo(ruta, buffer, MIMES[ext]);

  const docs = await getDocumentosPorPosicion(clienteId);
  const existente = docs[tipoNum];
  if (existente) {
    await pool.query("UPDATE documento SET Mime = ?, Extension = ?, path = ?, ocr = '' WHERE Id = ?", [
      MIMES[ext], extension, ruta, existente.Id,
    ]);
  } else {
    await pool.query(
      "INSERT INTO documento (cliente_id, Description, Mime, Extension, path, Active, posicion, ocr) VALUES (?, ?, ?, ?, ?, 1, ?, '')",
      [clienteId, tipoCat.nombre, MIMES[ext], extension, ruta, tipoNum],
    );
  }

  const actualizados = await getDocumentosPorPosicion(clienteId);
  const doc = actualizados[tipoNum];
  return { tipo: tipoNum, estado: estadoDocumento(doc), documento_id: doc ? Number(doc.Id) : null };
};

export const verDocumentoService = async ({ user, documento_id }) => {
  const id = Number(documento_id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError("Documento inválido", 400);

  const [[doc]] = await pool.query(
    `SELECT d.Id, d.path, d.Mime FROM documento d
       LEFT JOIN solicitud s ON s.id = d.solicitud_id
      WHERE d.Id = ? AND d.Active = 1 AND (d.borrado <> 1 OR d.borrado IS NULL)
        AND (d.cliente_id = ? OR s.cliente_id = ?)
      LIMIT 1`,
    [id, Number(user.cliente_id), Number(user.cliente_id)],
  );
  if (!doc) throw new AppError("Documento no encontrado", 404);
  return leerArchivo(doc.path, { mime: doc.Mime });
};
