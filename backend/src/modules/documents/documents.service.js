// src/modules/documents/documents.service.js
// Documentos personales del cliente (tabla documento, opción 1 = cliente).
// El archivo se guarda a través del puente con documento_model->adjunta_archivo para
// que quede en la misma ruta de S3 y con el mismo registro que en el sistema actual.

import { pool } from "../../config/db.js";
import { AppError } from "../../utils/appError.js";
import { callBridge } from "../../utils/bridge.js";

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

const TIPOS_PERMITIDOS_SQL =
  "SELECT id FROM catalogo WHERE id = ? AND catalogo_tipo_id IN (7,8,29) AND IFNULL(borrado,0) = 0 LIMIT 1";

export const subirDocumentoService = async ({ user, tipo, nombre, base64 }) => {
  const tipoNum = Number(tipo);
  if (!Number.isInteger(tipoNum) || tipoNum <= 0) throw new AppError("Tipo de documento inválido", 400);

  const [[existe]] = await pool.query(TIPOS_PERMITIDOS_SQL, [tipoNum]);
  if (!existe) throw new AppError("Tipo de documento inválido", 400);

  const ext = String(nombre || "").split(".").pop().toLowerCase();
  if (!["pdf", "jpg", "jpeg", "png"].includes(ext)) {
    throw new AppError("Solo se permiten archivos PDF, JPG o PNG", 400);
  }

  const limpio = String(base64 || "").replace(/^data:[^;]+;base64,/, "");
  if (!limpio) throw new AppError("Archivo vacío", 400);
  const bytes = Math.floor((limpio.length * 3) / 4);
  if (bytes > 10 * 1024 * 1024) throw new AppError("El archivo no debe pesar más de 10 MB", 400);

  await callBridge("subir_documento", user, { tipo: tipoNum, nombre: `documento.${ext}`, base64: limpio });

  const docs = await getDocumentosPorPosicion(user.cliente_id);
  const doc = docs[tipoNum];
  return {
    tipo: tipoNum,
    estado: estadoDocumento(doc),
    documento_id: doc ? Number(doc.Id) : null,
  };
};

export const verDocumentoService = async ({ user, documento_id }) => {
  const id = Number(documento_id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError("Documento inválido", 400);
  return callBridge("ver_documento", user, { documento_id: id });
};
