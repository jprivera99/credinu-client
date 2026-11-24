// src/modules/catalogs/catalogs.service.js
// Catálogos que usan las pantallas de la solicitud. Las consultas son las mismas que
// usa el sistema actual (Catalogo_model / Sepomex_model).

import { pool } from "../../config/db.js";
import { AppError } from "../../utils/appError.js";

const catalogo = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows.map((r) => ({ id: r.id, nombre: r.nombre }));
};

// Ids de catálogo que cambian el formulario (mismos que en las vistas PHP).
export const CATALOGO_IDS = {
  DESTINO_OTROS: 63,
  DESTINO_MEJORA_VIVIENDA: 56,
  DESTINO_PRODUCTIVO: 697,
  GRADO_ESTUDIOS_OTROS: 677,
  TIPO_PRODUCTO_MEJORA_VIVIENDA: 6,
};

export const DOMICILIO_TIPO = [
  { id: 1, nombre: "PROPIO" },
  { id: 2, nombre: "RENTADO" },
  { id: 3, nombre: "HIPOTECADO" },
];

export const getSolicitudCatalogsService = async ({ tipoProducto } = {}) => {
  const esMejoraVivienda = Number(tipoProducto) === CATALOGO_IDS.TIPO_PRODUCTO_MEJORA_VIVIENDA;

  const [estadoCivil, regimen, gradoEstudios, destino, porcentajeVivienda] = await Promise.all([
    catalogo("SELECT id, nombre FROM catalogo WHERE catalogo_tipo_id = 10 ORDER BY nombre"),
    catalogo("SELECT id, nombre FROM catalogo WHERE catalogo_tipo_id = 12 AND borrado = 0 ORDER BY pos"),
    catalogo("SELECT id, nombre FROM catalogo WHERE IFNULL(borrado,0) = 0 AND catalogo_tipo_id = 15 ORDER BY pos, nombre"),
    catalogo("SELECT id, nombre FROM catalogo WHERE catalogo_tipo_id = 11 AND id != 56 ORDER BY nombre"),
    catalogo("SELECT id, nombre FROM catalogo WHERE catalogo_tipo_id = 26 AND borrado = 0 ORDER BY pos"),
  ]);

  return {
    domicilio_tipo: DOMICILIO_TIPO,
    estado_civil: estadoCivil,
    regimen_patrimonial: regimen,
    grado_estudios: gradoEstudios,
    destino_credito: esMejoraVivienda
      ? [{ id: 56, nombre: "Autoconstrucción, construcción y/o mejora de vivienda" }]
      : destino,
    porcentaje_vivienda: porcentajeVivienda,
    ids: CATALOGO_IDS,
  };
};

/**
 * Código postal -> estado, municipios, ciudades y colonias (tabla sepomex).
 */
export const getSepomexByCpService = async (cp) => {
  const codigo = String(cp || "").replace(/\D/g, "");
  if (codigo.length !== 5) {
    throw new AppError("El código postal debe tener 5 dígitos", 400);
  }

  const [rows] = await pool.query(
    `SELECT c_estado, d_estado, c_mnpio, d_mnpio,
            CAST(c_cve_ciudad AS UNSIGNED) AS c_cve_ciudad, d_ciudad,
            id_asenta_cpcons, d_asenta, d_zona
       FROM sepomex
      WHERE d_codigo = ? AND c_estado > 0`,
    [codigo],
  );

  if (!rows.length) {
    throw new AppError("No encontramos ese código postal", 404);
  }

  const unique = (items, key) => {
    const map = new Map();
    for (const it of items) if (!map.has(it[key])) map.set(it[key], it);
    return [...map.values()];
  };

  return {
    cp: codigo,
    estados: unique(rows, "c_estado").map((r) => ({ id: Number(r.c_estado), nombre: r.d_estado })),
    municipios: unique(rows, "c_mnpio").map((r) => ({
      id: Number(r.c_mnpio),
      nombre: r.d_mnpio,
      estado_id: Number(r.c_estado),
    })),
    ciudades: unique(
      rows.filter((r) => Number(r.c_cve_ciudad) > 0),
      "c_cve_ciudad",
    ).map((r) => ({ id: Number(r.c_cve_ciudad), nombre: r.d_ciudad, municipio_id: Number(r.c_mnpio) })),
    colonias: unique(
      rows.filter((r) => Number(r.id_asenta_cpcons) > 0),
      "id_asenta_cpcons",
    )
      .map((r) => ({
        id: Number(r.id_asenta_cpcons),
        nombre: r.d_asenta,
        municipio_id: Number(r.c_mnpio),
        zona: r.d_zona,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
  };
};

/**
 * Valida una CLABE igual que promotor/Solicitud::revisaCLABE (banco, plaza y dígito de control).
 */
export const validarClabeService = async (clabeInput) => {
  const clabe = String(clabeInput || "").replace(/\s/g, "");
  const resp = {
    clabe,
    correcto: false,
    banco_id: 0,
    banco_nombre: "",
    plaza_codigo: 0,
    plaza_nombre: "",
    msg: "",
  };

  if (!/^\d{18}$/.test(clabe)) {
    resp.msg = "La CLABE debe contener 18 dígitos, sin espacios.";
    return resp;
  }

  const strBanco = clabe.substring(0, 3);
  const strPlaza = clabe.substring(3, 6);

  const [[banco]] = await pool.query(
    "SELECT id, pos, nombre FROM catalogo WHERE catalogo_tipo_id = 9 AND pos = ? LIMIT 1",
    [Number(strBanco)],
  );
  // El sistema actual busca la plaza en el catálogo 14 por pos.
  const [plazas] = await pool.query(
    "SELECT id, pos, nombre FROM catalogo WHERE catalogo_tipo_id = 14 AND pos = ? ORDER BY pos",
    [Number(strPlaza)],
  );

  if (banco) {
    resp.banco_id = Number(banco.pos);
    resp.banco_nombre = String(banco.nombre || "").trim();
  } else {
    resp.msg += `El banco ${strBanco} es incorrecto. `;
  }

  if (plazas.length > 0) {
    resp.plaza_codigo = Number(strPlaza);
    resp.plaza_nombre = plazas.map((p) => p.nombre).join("; ");
  } else {
    resp.msg += `La plaza ${strPlaza} es incorrecta. `;
  }

  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) {
    suma += (Number(clabe[i]) * pesos[i % 3]) % 10;
  }
  const unidad = suma % 10;
  const dc = unidad > 0 ? 10 - unidad : 0;

  if (Number(clabe[17]) !== dc) {
    resp.msg += "El dígito de control es incorrecto. ";
  }

  resp.correcto = resp.banco_id > 0 && resp.plaza_codigo > 0 && Number(clabe[17]) === dc;
  resp.msg = resp.msg.trim();
  return resp;
};
