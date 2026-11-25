// src/modules/applications/solicitud.repository.js
// Alta y actualización de solicitudes con las mismas bitácoras que el sistema actual
// (Solicitud_model + Log_Solicitud): log_solicitud y log_estatus_sol.

import { pool } from "../../config/db.js";
import { phpJsonEncode, comoMysqli } from "../../utils/phpJson.js";

/** "YYYY-MM-DD HH:mm:ss" en hora de la Ciudad de México (como date() en PHP). */
export const ahoraMexico = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Mexico_City",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());

export const hoyMexico = () => ahoraMexico().slice(0, 10);

// Comparación "suelta" como != de PHP para no registrar cambios falsos ("5" vs 5).
const iguales = (a, b) => {
  if (a === null || a === undefined || a === "") return b === null || b === undefined || b === "" || b === 0 || b === "0";
  if (b === null || b === undefined || b === "") return a === 0 || a === "0";
  if (!isNaN(Number(a)) && !isNaN(Number(b))) return Number(a) === Number(b);
  return String(a) === String(b);
};

export const insertSolicitud = async (datos, userId) => {
  const fecha = ahoraMexico();
  const row = { ...datos, registro_fecha: fecha, registrado_por: Number(userId) || 0 };
  const [res] = await pool.query("INSERT INTO solicitud SET ?", [row]);
  const id = res.insertId;

  if (row.estatus !== undefined) {
    await pool.query(
      "INSERT INTO log_estatus_sol (id_user, solicitud_id, estatus_inicial, estatus_final, date_time, id_subDevolucion) VALUES (?, ?, NULL, ?, ?, NULL)",
      [Number(userId) || 0, id, row.estatus, fecha],
    );
  }
  return id;
};

export const updateSolicitud = async (id, cambios, userId) => {
  const [[fila]] = await pool.query("SELECT * FROM solicitud WHERE id = ? LIMIT 1", [id]);
  if (!fila) return false;
  const original = comoMysqli(fila);

  await pool.query("UPDATE solicitud SET ? WHERE id = ?", [cambios, id]);

  const diferencias = {};
  for (const [k, nuevo] of Object.entries(cambios)) {
    if (k in original && !iguales(original[k], nuevo)) diferencias[k] = { original: original[k], nuevo };
  }
  if (!Object.keys(diferencias).length) return true;

  const fecha = ahoraMexico();
  await pool.query(
    "INSERT INTO log_solicitud (id_solicitud, id_user, movimiento, tabla, data_time, informacion_actualizar) VALUES (?, ?, 'update', 'solicitud', ?, ?)",
    [id, Number(userId) || 0, fecha, phpJsonEncode(diferencias, { unescapedUnicode: true })],
  );
  if (diferencias.estatus) {
    await pool.query(
      "INSERT INTO log_estatus_sol (id_user, solicitud_id, estatus_inicial, estatus_final, date_time, id_subDevolucion) VALUES (?, ?, ?, ?, ?, NULL)",
      [Number(userId) || 0, id, diferencias.estatus.original, diferencias.estatus.nuevo, fecha],
    );
  }
  return true;
};
