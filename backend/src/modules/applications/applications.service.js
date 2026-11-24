// src/modules/applications/applications.service.js
//
// Solicitudes de crédito del cliente. Reproduce el flujo de cte/Solicitud del sistema actual:
//
//   Producto normal (express = 0)              Producto express (express = 1)
//   1. Domicilio                                1. Domicilio
//   2. Datos generales                          2. Cuenta CLABE
//   3. Referencias personales                   3. Enviar (validación de INE con REM)
//   4. Redes sociales
//   5. Datos del contrato (PLD)
//   6. Cuenta CLABE
//   7. Documentos
//   8. Autorización de Buró de Crédito
//   9. Enviar (validación de INE con REM si no tiene INE vigente)
//
// Estatus usados (catálogo 5): 680 sin enviar, 681 cancelada, 11 enviada, 14 documentos para firma,
// 16 crédito aprobado, 17 rechazada por validación de identidad.

import { pool } from "../../config/db.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/appError.js";
import { callBridge } from "../../utils/bridge.js";
import { mapPayments } from "../quotation/quotation.service.js";
import { getSepomexByCpService, validarClabeService, CATALOGO_IDS } from "../catalogs/catalogs.service.js";
import { getDocumentosRequeridos } from "../documents/documents.service.js";
import { verifyPassword } from "../auth/auth.service.js";

export const ESTATUS = {
  SIN_ENVIAR: 680,
  CANCELADA: 681,
  ENVIADA: 11,
  FIRMA: 14,
  APROBADO: 16,
  RECHAZO_IDENTIDAD: 17,
};

// cte/Cotizacion: estatus que cuentan como "en proceso"
const ESTATUS_EN_PROCESO = [11, 12, 13, 14, 15, 49, 695, 720];

const PASOS_NORMAL = [
  "domicilio",
  "datos_generales",
  "referencias",
  "redes_sociales",
  "contrato",
  "clabe",
  "documentos",
  "buro",
  "enviar",
];
const PASOS_EXPRESS = ["domicilio", "clabe", "enviar"];

const parseJSON = (value, fallback) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const txt = (v, max = 255) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s.slice(0, max);
};
const upper = (v, max) => {
  const s = txt(v, max);
  return s ? s.toUpperCase() : s;
};
const int = (v) => {
  const n = parseInt(String(v ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};
const money = (v) => {
  const n = Number(String(v ?? "").replace(/[,$\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};
/** "YYYY-MM-DD HH:mm:ss" en hora de la Ciudad de México (como date() en PHP). */
const ahoraMexico = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Mexico_City",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());

const telefono = (v) => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length ? d.slice(-10) : null;
};

/* ======================================================================= */
/* CONSULTAS BASE                                                           */
/* ======================================================================= */

/** Solicitud del cliente autenticado (o error 404). */
const getSolicitudDelCliente = async (solicitud_id, user) => {
  const [rows] = await pool.query(
    `SELECT s.*, s.estatus AS estatus_id, cat.nombre AS estatus_nombre,
            ip.express, ip.carga_documentos, ip.detalle_completo, ip.nombre_comercial AS producto_nombre,
            banco.nombre AS banco_nombre
       FROM solicitud s
       LEFT JOIN institucion_producto ip ON ip.id = s.institucion_producto_id
       LEFT JOIN catalogo cat ON cat.id = s.estatus
       LEFT JOIN catalogo banco ON banco.catalogo_tipo_id = 9 AND banco.pos = s.banco_id
      WHERE s.id = ? AND s.cliente_id = ? AND IFNULL(s.borrado,0) = 0
      LIMIT 1`,
    [Number(solicitud_id), Number(user.cliente_id)],
  );
  if (!rows.length) throw new AppError("Solicitud no encontrada", 404);
  return rows[0];
};

const getCliente = async (cliente_id) => {
  const [rows] = await pool.query("SELECT * FROM cliente WHERE id = ? LIMIT 1", [cliente_id]);
  if (!rows.length) throw new AppError("Cliente no encontrado", 404);
  return rows[0];
};

const exigirEditable = (solicitud) => {
  if (Number(solicitud.estatus_id) !== ESTATUS.SIN_ENVIAR) {
    throw new AppError("Esta solicitud ya fue enviada y no se puede modificar", 409);
  }
};

const buroAutorizado = async (solicitud_id) => {
  const [rows] = await pool.query(
    "SELECT 1 FROM layout_nip_bc WHERE `noTransacción` = ? LIMIT 1",
    [String(solicitud_id)],
  );
  return rows.length > 0;
};

/* ======================================================================= */
/* VALIDACIÓN DE SECCIONES (servidor)                                       */
/* ======================================================================= */

const faltantesDomicilio = (c) => {
  const f = [];
  if (!c.domicilio_cp) f.push("Código postal");
  if (!Number(c.domicilio_estado_id)) f.push("Estado");
  if (!Number(c.domicilio_municipio_id)) f.push("Municipio");
  if (!Number(c.domicilio_colonia_id)) f.push("Colonia");
  if (!c.domicilio_calle) f.push("Calle");
  if (!c.domicilio_calle_numext) f.push("Número exterior");
  return f;
};

const faltantesDatosGenerales = (c) => {
  const f = [];
  if (!c.ocupacion_profesion) f.push("Ocupación o profesión");
  if (!c.empleo_puesto) f.push("Puesto");
  if (!c.empleo_departamento) f.push("Área o departamento");
  if (!c.giro_negocio) f.push("Actividad o giro de la empresa");
  if (!c.ciudad_nacimiento) f.push("Ciudad de nacimiento");
  if (![1, 2, 3].includes(Number(c.domicilio_tipo))) f.push("Tipo de domicilio");
  if (c.domicilio_antiguedadanios == null || c.domicilio_antiguedadanios === "") f.push("Años en el domicilio");
  if (!Number(c.estado_civil)) f.push("Estado civil");
  if (!Number(c.regimen_patrimonial)) f.push("Régimen matrimonial");
  if (c.dependientes_economicos == null || c.dependientes_economicos === "") f.push("Dependientes económicos");
  if (!Number(c.grado_estudio_id)) f.push("Grado de estudios");
  if (Number(c.grado_estudio_id) === CATALOGO_IDS.GRADO_ESTUDIOS_OTROS && !c.grado_estudios_otros) {
    f.push("Especifique grado de estudios");
  }
  return f;
};

const faltantesReferencias = (s) => {
  const refs = parseJSON(s.referencias_json, {});
  const f = [];
  for (const k of ["1", "2", "3"]) {
    const r = refs[k] || {};
    if (!r.nombre || !r.parentesco || String(r.telefono_movil || "").replace(/\D/g, "").length !== 10) {
      f.push(`Referencia ${k}`);
    }
  }
  return f;
};

const faltantesContrato = (s) => {
  const f = [];
  const destino = Number(s.destino_credito);
  if (!destino) f.push("Destino del crédito");
  if (destino === CATALOGO_IDS.DESTINO_OTROS && !s.destino_credito_otros) f.push("Especifique destino");
  if (destino === CATALOGO_IDS.DESTINO_MEJORA_VIVIENDA && (!s.porcentaje_vivienda || !s.descripcion_vivienda)) {
    f.push("Datos de mejora de vivienda");
  }
  if (destino === CATALOGO_IDS.DESTINO_PRODUCTIVO) {
    if (!s.nombre_negocio || !s.tiempo_negocio || !s.direccion_negocio || !s.descr_cred_sol || !s.cargo_negocio) {
      f.push("Datos del negocio");
    }
  }
  if (![1, 2].includes(Number(s.personas_pol_exp))) f.push("Persona políticamente expuesta");
  if (Number(s.personas_pol_exp) === 1 && !s.nombre_personas_pol_exp) f.push("Nombre de la persona políticamente expuesta");
  if (![1, 2].includes(Number(s.cuenta_propia))) f.push("Actúa por cuenta propia");
  if (Number(s.cuenta_propia) === 2 && !s.nombre_tercero) f.push("Nombre del tercero");
  if (![1, 2].includes(Number(s.propietario_real))) f.push("Propietario real");
  if (Number(s.propietario_real) === 2 && !s.nombre_propietario_real) f.push("Nombre del propietario real");
  return f;
};

const faltantesClabe = (s) => (Number(s.clabe_valida) === 1 && String(s.clabe || "").length === 18 ? [] : ["Cuenta CLABE"]);

const faltantesDocumentos = (docs) => docs.filter((d) => d.estado === "faltante").map((d) => d.nombre);

const calcularPasos = async (solicitud, cliente) => {
  const express = Number(solicitud.express) === 1;
  const docs = express ? [] : await getDocumentosRequeridos(cliente.id, solicitud.carga_documentos);
  const buro = express ? true : await buroAutorizado(solicitud.id);

  const faltantes = {
    domicilio: faltantesDomicilio(cliente),
    datos_generales: faltantesDatosGenerales(cliente),
    referencias: faltantesReferencias(solicitud),
    redes_sociales: [],
    contrato: faltantesContrato(solicitud),
    clabe: faltantesClabe(solicitud),
    documentos: faltantesDocumentos(docs),
    buro: buro ? [] : ["Autorización de consulta de Buró de Crédito"],
  };

  const pasos = (express ? PASOS_EXPRESS : PASOS_NORMAL).map((clave) => ({
    clave,
    completo: clave === "enviar" ? false : (faltantes[clave] || []).length === 0,
    faltantes: faltantes[clave] || [],
  }));

  return { pasos, docs, buro };
};

/* ======================================================================= */
/* LISTADO                                                                  */
/* ======================================================================= */

export const getApplicationsByAuthenticatedUser = async (user) => {
  const [rows] = await pool.query(
    `SELECT s.id, s.estatus AS estatus_id, c.nombre AS estatus_nombre, s.registro_fecha,
            s.monto_credito, s.monto_autorizado, s.amortizacion, ip.nombre_comercial
       FROM solicitud s
       LEFT JOIN catalogo c ON c.id = s.estatus
       LEFT JOIN institucion_producto ip ON ip.id = s.institucion_producto_id
      WHERE s.cliente_id = ? AND IFNULL(s.borrado,0) = 0
      ORDER BY s.id DESC`,
    [user.cliente_id],
  );

  return rows.map((row) => {
    const amort = parseJSON(row.amortizacion, {});
    const estatus = Number(row.estatus_id);
    return {
      id: row.id,
      estatus_id: estatus,
      estatus: row.estatus_nombre ?? null,
      fecha_registro: row.registro_fecha,
      monto_credito: Number(row.monto_credito || 0),
      producto: amort?.info?.nombre_comercial || row.nombre_comercial || null,
      puede_continuar: estatus === ESTATUS.SIN_ENVIAR,
      requiere_firma: estatus === ESTATUS.FIRMA,
    };
  });
};

/* ======================================================================= */
/* VALIDAR / CREAR                                                          */
/* ======================================================================= */

export const validateApplicationService = async ({ cliente_id, institucion_producto_id }) => {
  const [productoRows] = await pool.query(
    "SELECT id, express, requiere_autorizacion_rh FROM institucion_producto WHERE id = ? AND IFNULL(borrado,0) = 0 LIMIT 1",
    [institucion_producto_id],
  );
  const producto = productoRows[0];
  if (!producto) throw new AppError("Producto no encontrado", 404);

  const [clienteRows] = await pool.query(
    "SELECT IFNULL(validado,0) AS validado FROM sis_usuario WHERE cliente_id = ? AND IFNULL(borrado,0) = 0 ORDER BY id DESC LIMIT 1",
    [cliente_id],
  );
  const alerta = Number(clienteRows[0]?.validado || 0);

  if (alerta !== 2 && Number(producto.requiere_autorizacion_rh) === 0) {
    return {
      success: false,
      type: "RH_VALIDATION",
      message:
        alerta === 3
          ? "Estimado Cliente: Su solicitud ha sido rechazada, favor de contactar al área de Recursos Humanos de su empresa para cualquier aclaración."
          : "Estimado Cliente podrás solicitar tu préstamo una vez que Recursos Humanos haya validado tu información. Por favor consulta tu correo electrónico.",
    };
  }

  const [vigenteRows] = await pool.query(
    "SELECT id FROM solicitud WHERE cliente_id = ? AND IFNULL(borrado,0) = 0 AND estatus = ? ORDER BY id DESC LIMIT 1",
    [cliente_id, ESTATUS.SIN_ENVIAR],
  );
  if (vigenteRows[0]) {
    return {
      success: false,
      type: "PENDING",
      solicitud_id: vigenteRows[0].id,
      message:
        "Tiene usted una Solicitud sin enviar. Para continuar puede editar la solicitud pendiente o cancelarla y crear una nueva.",
    };
  }

  const [procesoRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM solicitud WHERE cliente_id = ? AND IFNULL(borrado,0) = 0 AND estatus IN (?)",
    [cliente_id, ESTATUS_EN_PROCESO],
  );
  if (Number(procesoRows[0]?.total || 0) > 0) {
    return {
      success: false,
      type: "PROCESS",
      message:
        "Tiene actualmente solicitudes en proceso de revisión. No puede enviar más solicitudes hasta que finalice las actuales. Para verificar el estado de sus solicitudes, vaya al menú 'Solicitudes de Crédito'.",
    };
  }

  return { success: true, express: Number(producto.express || 0) };
};

export const createApplicationService = async ({ user, monto, ingreso, plazo, institucion_producto_id }) => {
  if (!institucion_producto_id || Number(institucion_producto_id) <= 0) throw new AppError("Producto requerido", 400);
  if (!monto || Number(monto) <= 0) throw new AppError("Monto inválido", 400);
  if (!ingreso || Number(ingreso) <= 0) throw new AppError("Ingreso inválido", 400);

  // El cotizador del sistema actual recalcula y guarda la amortización con el formato que
  // usan el expediente y la generación de contratos.
  return callBridge("crear_solicitud", user, {
    institucion_producto_id: Number(institucion_producto_id),
    monto: Number(monto),
    ingreso: Number(ingreso),
    duracion: Number(plazo) || 0,
  });
};

/* ======================================================================= */
/* DETALLE                                                                  */
/* ======================================================================= */

export const getApplicationByIdService = async ({ solicitud_id, user }) => {
  const s = await getSolicitudDelCliente(solicitud_id, user);
  const c = await getCliente(s.cliente_id);
  const amort = parseJSON(s.amortizacion, {});
  const info = amort?.info || {};
  const { pasos, docs, buro } = await calcularPasos(s, c);

  const refs = parseJSON(s.referencias_json, {});
  const referencias = ["1", "2", "3"].map((k) => ({
    nombre: refs[k]?.nombre || "",
    parentesco: refs[k]?.parentesco || "",
    telefono_movil: refs[k]?.telefono_movil || "",
  }));

  const estatus = Number(s.estatus_id);

  return {
    solicitud: {
      id: s.id,
      estatus_id: estatus,
      estatus: s.estatus_nombre || null,
      motivo_rechazo: estatus === ESTATUS.RECHAZO_IDENTIDAD || estatus === ESTATUS.CANCELADA ? s.motivo_rechazo || null : null,
      editable: estatus === ESTATUS.SIN_ENVIAR,
      express: Number(s.express) === 1,
      fecha_registro: s.registro_fecha,
      producto: info.nombre_comercial || s.producto_nombre || null,
      tipo_producto: s.tipo_credito,
      periodicidad: info.periodicidad || s.periodicidad || null,
      monto_credito: Number(s.monto_credito || 0),
      monto_autorizado: Number(s.monto_autorizado || 0),
      monto_pago: Number(s.monto_pago || 0),
      monto_total: Number(s.monto_total || 0),
      total_pagos: Number(s.total_pagos || 0),
      plazo_meses: s.plazo_meses,
      num_pagos_adelanto: s.num_pagos_adelanto,
      monto_adelanto: s.monto_adelanto,
      clabe: s.clabe || "",
      clabe_valida: Number(s.clabe_valida) === 1,
      banco_nombre: s.banco_nombre || null,
      detalle_completo: Number(s.detalle_completo) === 1,
      tabla: mapPayments(amort?.amortizacion?.payments || []),
    },
    domicilio: {
      cp: c.domicilio_cp || "",
      estado_id: Number(c.domicilio_estado_id) || null,
      estado: c.domicilio_estado || "",
      municipio_id: Number(c.domicilio_municipio_id) || null,
      municipio: c.domicilio_municipio || "",
      ciudad_id: Number(c.domicilio_ciudad_id) || null,
      ciudad: c.domicilio_ciudad || "",
      colonia_id: Number(c.domicilio_colonia_id) || null,
      colonia: c.domicilio_colonia || "",
      calle: c.domicilio_calle || "",
      numero_exterior: c.domicilio_calle_numext || "",
      numero_interior: c.domicilio_calle_numint || "",
    },
    datos_generales: {
      ocupacion_profesion: c.ocupacion_profesion || "",
      empleo_puesto: c.empleo_puesto || "",
      empleo_departamento: c.empleo_departamento || "",
      giro_negocio: c.giro_negocio || "",
      ciudad_nacimiento: c.ciudad_nacimiento || "",
      domicilio_tipo: [1, 2, 3].includes(Number(c.domicilio_tipo)) ? Number(c.domicilio_tipo) : null,
      domicilio_antiguedadanios: c.domicilio_antiguedadanios ?? "",
      estado_civil: Number(c.estado_civil) || null,
      regimen_patrimonial: Number(c.regimen_patrimonial) || null,
      dependientes_economicos: c.dependientes_economicos ?? "",
      grado_estudio_id: Number(c.grado_estudio_id) || null,
      grado_estudios_otros: c.grado_estudios_otros || "",
    },
    referencias,
    redes_sociales: {
      facebook: "",
      instagram: "",
      linkedln: "",
      twitter: "",
      otros: "",
      ...parseJSON(c.redes_sociales, {}),
    },
    contrato: {
      destino_credito: Number(s.destino_credito) || null,
      destino_credito_otros: s.destino_credito_otros || "",
      porcentaje_vivienda: Number(s.porcentaje_vivienda) || null,
      descripcion_vivienda: s.descripcion_vivienda || "",
      empleo_gastos_totales: c.empleo_gastos_totales ?? "",
      nombre_negocio: s.nombre_negocio || "",
      tiempo_negocio: s.tiempo_negocio || "",
      direccion_negocio: s.direccion_negocio || "",
      descr_cred_sol: s.descr_cred_sol || "",
      cargo_negocio: s.cargo_negocio || "",
      personas_pol_exp: Number(s.personas_pol_exp) || null,
      nombre_personas_pol_exp: s.nombre_personas_pol_exp || "",
      cuenta_propia: Number(s.cuenta_propia) || null,
      nombre_tercero: s.nombre_tercero || "",
      propietario_real: Number(s.propietario_real) || null,
      nombre_propietario_real: s.nombre_propietario_real || "",
    },
    documentos: docs,
    buro_autorizado: buro,
    pasos,
  };
};

/* ======================================================================= */
/* GUARDAR SECCIONES                                                        */
/* ======================================================================= */

const guardarDomicilio = async (s, d) => {
  const sep = await getSepomexByCpService(d.cp);
  const estado = sep.estados.find((e) => e.id === Number(d.estado_id));
  const municipio = sep.municipios.find((m) => m.id === Number(d.municipio_id));
  const colonia = sep.colonias.find((c) => c.id === Number(d.colonia_id) && c.municipio_id === Number(d.municipio_id));
  const ciudad = sep.ciudades.find((c) => c.id === Number(d.ciudad_id));

  if (!estado || !municipio || !colonia) {
    throw new AppError("El estado, municipio o colonia no corresponden al código postal", 400);
  }
  const calle = upper(d.calle, 150);
  const numext = upper(d.numero_exterior, 20);
  if (!calle || !numext) throw new AppError("Calle y número exterior son obligatorios", 400);

  await pool.query(
    `UPDATE cliente SET
        domicilio_cp = ?, domicilio_estado_id = ?, domicilio_estado = ?,
        domicilio_municipio_id = ?, domicilio_municipio = ?,
        domicilio_ciudad_id = ?, domicilio_ciudad = ?,
        domicilio_colonia_id = ?, domicilio_colonia = ?,
        domicilio_tipo = IF(domicilio_tipo IN ('1','2','3'), domicilio_tipo, ?), domicilio_pais = 'México',
        domicilio_calle = ?, domicilio_calle_numext = ?, domicilio_calle_numint = ?
      WHERE id = ?`,
    [
      sep.cp, estado.id, estado.nombre,
      municipio.id, municipio.nombre,
      ciudad ? ciudad.id : 0, ciudad ? ciudad.nombre : "",
      colonia.id, colonia.nombre, colonia.zona || null,
      calle, numext, upper(d.numero_interior, 20) || "",
      s.cliente_id,
    ],
  );
};

const guardarDatosGenerales = async (s, d) => {
  const grado = int(d.grado_estudio_id);
  await pool.query(
    `UPDATE cliente SET
        ocupacion_profesion = ?, empleo_puesto = ?, empleo_departamento = ?, giro_negocio = ?,
        ciudad_nacimiento = ?, domicilio_tipo = ?, domicilio_antiguedadanios = ?, estado_civil = ?,
        regimen_patrimonial = ?, dependientes_economicos = ?, grado_estudio_id = ?, grado_estudios_otros = ?
      WHERE id = ?`,
    [
      upper(d.ocupacion_profesion, 150) || "", upper(d.empleo_puesto, 150) || "", upper(d.empleo_departamento, 150) || "",
      upper(d.giro_negocio, 150) || "", upper(d.ciudad_nacimiento, 150) || "",
      [1, 2, 3].includes(int(d.domicilio_tipo)) ? int(d.domicilio_tipo) : 0,
      int(d.domicilio_antiguedadanios) ?? 0, int(d.estado_civil) || 0, int(d.regimen_patrimonial) || 0,
      int(d.dependientes_economicos) ?? 0, grado || 0,
      grado === CATALOGO_IDS.GRADO_ESTUDIOS_OTROS ? upper(d.grado_estudios_otros, 150) : "",
      s.cliente_id,
    ],
  );
};

const guardarReferencias = async (s, lista) => {
  const arr = Array.isArray(lista) ? lista : Object.values(lista || {});
  const json = {};
  [0, 1, 2].forEach((i) => {
    const r = arr[i] || {};
    json[String(i + 1)] = {
      nombre: upper(r.nombre, 150) || "",
      parentesco: upper(r.parentesco, 60) || "",
      telefono_movil: telefono(r.telefono_movil ?? r.telefono) || "",
    };
  });
  await pool.query("UPDATE solicitud SET referencias_json = ? WHERE id = ?", [JSON.stringify(json), s.id]);
};

const guardarRedes = async (s, d) => {
  const json = {
    facebook: txt(d.facebook, 200) || "",
    instagram: txt(d.instagram, 200) || "",
    linkedln: txt(d.linkedln, 200) || "",
    twitter: txt(d.twitter, 200) || "",
    otros: txt(d.otros, 200) || "",
  };
  await pool.query("UPDATE cliente SET redes_sociales = ? WHERE id = ?", [JSON.stringify(json), s.cliente_id]);
};

const guardarContrato = async (s, d) => {
  const destino = int(d.destino_credito) || 0;
  const pep = int(d.personas_pol_exp);
  const propia = int(d.cuenta_propia);
  const propietario = int(d.propietario_real);
  const productivo = destino === CATALOGO_IDS.DESTINO_PRODUCTIVO;
  const vivienda = destino === CATALOGO_IDS.DESTINO_MEJORA_VIVIENDA;

  await pool.query(
    `UPDATE solicitud SET
        destino_credito = ?, destino_credito_otros = ?, porcentaje_vivienda = ?, descripcion_vivienda = ?,
        nombre_negocio = ?, tiempo_negocio = ?, direccion_negocio = ?, descr_cred_sol = ?, cargo_negocio = ?,
        personas_pol_exp = ?, nombre_personas_pol_exp = ?, cuenta_propia = ?, nombre_tercero = ?,
        propietario_real = ?, nombre_propietario_real = ?
      WHERE id = ?`,
    [
      destino,
      destino === CATALOGO_IDS.DESTINO_OTROS ? upper(d.destino_credito_otros, 200) || "" : "",
      vivienda ? int(d.porcentaje_vivienda) || 0 : 0,
      vivienda ? upper(d.descripcion_vivienda, 255) || "" : "",
      productivo ? upper(d.nombre_negocio, 150) || "" : "",
      productivo ? upper(d.tiempo_negocio, 60) || "" : "",
      productivo ? upper(d.direccion_negocio, 255) || "" : "",
      productivo ? upper(d.descr_cred_sol, 255) || "" : "",
      productivo ? upper(d.cargo_negocio, 150) || "" : "",
      [1, 2].includes(pep) ? pep : 0,
      pep === 1 ? upper(d.nombre_personas_pol_exp, 255) || "" : "",
      [1, 2].includes(propia) ? propia : 0,
      propia === 2 ? upper(d.nombre_tercero, 255) || "" : "",
      [1, 2].includes(propietario) ? propietario : 0,
      propietario === 2 ? upper(d.nombre_propietario_real, 255) || "" : "",
      s.id,
    ],
  );

  const gastos = money(d.empleo_gastos_totales);
  await pool.query("UPDATE cliente SET empleo_gastos_totales = ? WHERE id = ?", [gastos ?? 0, s.cliente_id]);
};

const guardarClabe = async (s, d) => {
  const r = await validarClabeService(d.clabe);
  if (!r.correcto) throw new AppError(r.msg || "CLABE incorrecta", 400);
  await pool.query("UPDATE solicitud SET clabe = ?, banco_id = ?, clabe_valida = 1 WHERE id = ?", [r.clabe, r.banco_id, s.id]);
  return { banco_nombre: r.banco_nombre };
};

const guardarDispositivo = async (s, d) => {
  // Datos que el sistema actual guarda junto con la documentación (ajaxActualizaDocumentos).
  await pool.query(
    "UPDATE solicitud SET Plataforma = ?, Navegador = ?, Latitud = ?, Longitud = ?, Precicion = ? WHERE id = ?",
    [
      txt(d.plataforma, 100),
      txt(d.navegador, 255),
      txt(d.latitud, 30),
      txt(d.longitud, 30),
      txt(d.precision, 30),
      s.id,
    ],
  );
};

const SECCIONES = {
  domicilio: guardarDomicilio,
  datos_generales: guardarDatosGenerales,
  referencias: guardarReferencias,
  redes_sociales: guardarRedes,
  contrato: guardarContrato,
  clabe: guardarClabe,
  dispositivo: guardarDispositivo,
};

export const updateApplicationSectionService = async ({ solicitud_id, user, seccion, datos }) => {
  const guardar = SECCIONES[seccion];
  if (!guardar) throw new AppError("Sección inválida", 400);

  const s = await getSolicitudDelCliente(solicitud_id, user);
  exigirEditable(s);

  const extra = await guardar(s, datos || {});
  return { seccion, ...(extra || {}) };
};

/* ======================================================================= */
/* BURÓ DE CRÉDITO                                                          */
/* ======================================================================= */

export const autorizarBuroService = async ({ solicitud_id, user, password }) => {
  const s = await getSolicitudDelCliente(solicitud_id, user);
  exigirEditable(s);

  const [[usuario]] = await pool.query("SELECT password FROM sis_usuario WHERE id = ? LIMIT 1", [user.id]);
  const check = await verifyPassword(password || "", usuario?.password);
  if (!check.valid) throw new AppError("La contraseña es incorrecta", 400);

  if (await buroAutorizado(s.id)) return { autorizado: true };

  const c = await getCliente(s.cliente_id);
  // Mismos campos que cte/Solicitud::ajaxValidaBuroCredito
  await pool.query(
    "INSERT INTO layout_nip_bc (`noTransacción`, fecha, nombre, paterno, materno, rfc, calleno, colonia, edo, ciudad, ingreso_nuevamente_NIP, respuesta_leyenda_autorizacion, folio_consulta_bc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'S', 'S', '')",
    [
      String(s.id),
      ahoraMexico(),
      c.nombre, c.apellido_paterno, c.apellido_materno, c.rfc,
      `${c.domicilio_calle || ""} ${c.domicilio_calle_numext || ""}`.trim(),
      c.domicilio_colonia, c.domicilio_estado, c.domicilio_municipio,
    ],
  );
  return { autorizado: true };
};

/* ======================================================================= */
/* CANCELAR                                                                 */
/* ======================================================================= */

export const cancelApplicationService = async ({ solicitud_id, user }) => {
  const s = await getSolicitudDelCliente(solicitud_id, user);
  exigirEditable(s);
  await pool.query("UPDATE solicitud SET estatus = ?, estatus_id = ? WHERE id = ?", [ESTATUS.CANCELADA, ESTATUS.CANCELADA, s.id]);
  return { cancelada: true };
};

/* ======================================================================= */
/* ENVIAR                                                                   */
/* ======================================================================= */

const redirectUrl = (solicitud_id) => `${env.frontUrl}/dashboard/solicitud/${solicitud_id}/finalizado`;

/**
 * Revisa que todo esté completo y arranca el envío:
 *  - INE vigente → se envía directo (estatus 11, validación CLABE y correos).
 *  - Sin INE vigente → regresa la liga de REM para capturar la INE.
 */
export const finalizeApplicationService = async ({ solicitud_id, user }) => {
  const s = await getSolicitudDelCliente(solicitud_id, user);
  exigirEditable(s);

  const c = await getCliente(s.cliente_id);
  const { pasos } = await calcularPasos(s, c);
  const pendientes = pasos.filter((p) => p.clave !== "enviar" && !p.completo);
  if (pendientes.length) {
    throw new AppError(
      `Antes de enviar completa: ${pendientes.map((p) => p.faltantes.join(", ")).join("; ")}`,
      400,
      { pendientes },
    );
  }

  const inicio = await callBridge("iniciar_validacion", user, {
    solicitud_id: s.id,
    redirect_url: redirectUrl(s.id),
  });

  if (inicio?.modo === "rem" && inicio.public_url) {
    return { estado: "validar_identidad", public_url: inicio.public_url };
  }

  const fin = await callBridge("terminar", user, { solicitud_id: s.id, modo: "directo" });
  return { estado: fin?.estado || "enviada" };
};

/**
 * Regreso de REM (redirect con ?workflow=&workflow_status=&last_step=).
 * Equivale a cte/Solicitud::terminarSolicitud_express.
 */
export const completeApplicationService = async ({ solicitud_id, user, workflow, workflow_status, last_step }) => {
  const s = await getSolicitudDelCliente(solicitud_id, user);
  const fin = await callBridge("terminar", user, {
    solicitud_id: s.id,
    modo: "rem",
    workflow: txt(workflow, 100) || "",
    workflow_status: txt(workflow_status, 30) || "",
    last_step: txt(last_step, 100) || "",
    redirect_url: redirectUrl(s.id),
  });
  return fin;
};

/* ======================================================================= */
/* FIRMA Y CONTRATO                                                         */
/* ======================================================================= */

export const signApplicationService = async ({ solicitud_id, user }) => {
  const s = await getSolicitudDelCliente(solicitud_id, user);
  if (Number(s.estatus_id) !== ESTATUS.FIRMA) {
    throw new AppError("La solicitud no tiene documentos pendientes de firma", 409);
  }
  return callBridge("firma", user, { solicitud_id: s.id });
};

export const signedContractService = async ({ solicitud_id, user }) => {
  const s = await getSolicitudDelCliente(solicitud_id, user);
  if (Number(s.estatus_id) !== ESTATUS.APROBADO) {
    throw new AppError("El contrato estará disponible cuando el crédito sea aprobado", 409);
  }
  return callBridge("contrato_firmado", user, { solicitud_id: s.id });
};
