// src/utils/bridge.js
// Cliente HTTP del puente con el sistema actual (application/controllers/Clientbridge.php).
// El portal nuevo sólo valida permisos y datos; la lógica financiera y de integraciones
// (cotizador, REM, STP/Dispersa, contratos, S3, correos) se ejecuta allá para que el
// administrador vea exactamente la misma información que antes.

import { env } from "../config/env.js";
import { AppError } from "./appError.js";

export const callBridge = async (accion, user, payload = {}) => {
  if (!env.bridgeUrl || !env.bridgeToken) {
    console.error(`[bridge] ${accion}: falta configurar BRIDGE_URL y BRIDGE_TOKEN en backend/.env`);
    throw new AppError("Servicio no disponible. Intenta más tarde.", 503);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.bridgeTimeoutMs);

  let res;
  try {
    res = await fetch(`${env.bridgeUrl}/${accion}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Bridge-Token": env.bridgeToken,
      },
      body: JSON.stringify({ ...payload, user_id: user.id }),
      signal: controller.signal,
    });
  } catch (error) {
    console.error(`[bridge] ${accion} sin respuesta:`, error.message);
    throw new AppError("No fue posible conectar con el servicio. Intenta de nuevo.", 502);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    console.error(`[bridge] ${accion} respuesta no JSON (${res.status}):`, text.slice(0, 500));
    throw new AppError("Respuesta inválida del servicio.", 502);
  }

  if (!res.ok || !json?.success) {
    // 401 del puente es un problema de configuración (token), no de la sesión del cliente:
    // no se reenvía como 401 para que el portal no cierre la sesión.
    if (res.status === 401 || res.status === 503) {
      console.error(`[bridge] ${accion} rechazado (${res.status}): revisar BRIDGE_TOKEN / CLIENT_BRIDGE_TOKEN`);
      throw new AppError("Servicio no disponible. Intenta más tarde.", 503);
    }
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    throw new AppError(json?.message || "Error en el servicio.", status);
  }

  return json.data ?? null;
};
