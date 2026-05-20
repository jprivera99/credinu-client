//src/modules/rem/processRem.service.js
import { pool } from "../../config/db.js";

export const insertProcessRemLog = async ({
  tipo = "",
  proceso = "",
  id_rem = null,
  relacion = "Cliente",
  id_relacion = null,
  url = "",
  data = {},
  respuesta = {},
  webhook_uuid = null,
}) => {

  console.log("Insertando log de proceso REM:", {
    tipo,
    proceso,
    id_rem,
    relacion,
    id_relacion,
    url,
    data,
    respuesta,
    webhook_uuid,
  });
  
  try {
    await pool.query(
      `INSERT INTO process_rem
      (tipo, id_rem, relacion, id_relacion, url, data, respuesta, datetime, webhook_uuid, proceso)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        tipo,
        id_rem,
        relacion,
        id_relacion,
        url,
        JSON.stringify(data),
        JSON.stringify(respuesta),
        webhook_uuid,
        proceso,
      ]
    );
  } catch (error) {
    console.error("Error guardando process_rem:", error);
  }
};