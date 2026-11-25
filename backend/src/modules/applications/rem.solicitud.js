// src/modules/applications/rem.solicitud.js
// Validación de INE con REM al enviar la solicitud (igual que remtoolsapi_helper::setWorkFlow con
// el paso "enroll_basic"). El workflow queda registrado en process_rem con el mismo formato, así
// el webhook de REM que ya procesa el sistema actual sigue funcionando sin cambios.

import { pool } from "../../config/db.js";
import { AppError } from "../../utils/appError.js";
import {
  syncPersonRemService,
  createWorkflowRemService,
} from "../rem/rem.workflow.service.js";
import { createWorkflowTokenRemService } from "../rem/rem.service.js";

/** buscar_variable_en_json: primer valor de la llave en cualquier nivel. */
const buscar = (obj, llave) => {
  if (!obj || typeof obj !== "object") return null;
  if (llave in obj && obj[llave] !== null && obj[llave] !== undefined) return obj[llave];
  for (const v of Object.values(obj)) {
    const r = buscar(v, llave);
    if (r !== null && r !== undefined) return r;
  }
  return null;
};

/** RemTools_conf del catálogo (mismo interruptor "activo" del sistema actual). */
export const remActivo = async () => {
  if (!process.env.REM_APIKEY || !process.env.REM_URL) return false;
  const [[row]] = await pool.query("SELECT codigo FROM catalogo WHERE nombre = 'RemTools_conf' LIMIT 1");
  if (!row?.codigo) return true;
  try {
    return Number(JSON.parse(row.codigo)?.activo) === 1;
  } catch {
    return true;
  }
};

const crearToken = async ({ solicitud, workflow_uuid, people_uuid, redirect_url, proceso }) => {
  const token = await createWorkflowTokenRemService({
    workflow_uuid,
    redirect_url,
    cliente_id: solicitud.cliente_id,
    people_uuid,
    solicitud_id: solicitud.id,
    proceso,
  });
  return buscar(token, "public_url");
};

export const iniciarValidacionIne = async ({ solicitud, redirect_url, proceso }) => {
  const people_uuid = await syncPersonRemService({ cliente_id: solicitud.cliente_id });
  const wf = await createWorkflowRemService({
    cliente_id: solicitud.cliente_id,
    solicitud_id: solicitud.id,
    people_uuid,
    redirect_url,
  });

  const workflow_uuid = buscar(wf, "uuid");
  if (!workflow_uuid) {
    console.error("[REM] workflow sin uuid", JSON.stringify(wf).slice(0, 500));
    throw new AppError("No fue posible iniciar la validación de identidad. Intenta de nuevo.", 502);
  }

  const public_url = await crearToken({
    solicitud,
    workflow_uuid,
    people_uuid: buscar(wf, "people_uuid") || people_uuid,
    redirect_url,
    proceso,
  });
  if (!public_url) throw new AppError("No fue posible iniciar la validación de identidad. Intenta de nuevo.", 502);
  return public_url;
};

/** Nueva liga para reintentar la captura de la INE (regenerar_token_rem). */
export const regenerarTokenIne = async ({ solicitud, workflow_uuid, redirect_url, proceso }) => {
  try {
    const [[c]] = await pool.query("SELECT id_rem FROM cliente WHERE id = ? LIMIT 1", [solicitud.cliente_id]);
    return await crearToken({ solicitud, workflow_uuid, people_uuid: c?.id_rem || "", redirect_url, proceso });
  } catch (error) {
    console.error("[REM] no se pudo regenerar token:", error.message);
    return null;
  }
};
