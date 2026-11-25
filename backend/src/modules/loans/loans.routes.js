// Mis préstamos: contratos del cliente en el API externo (igual que Cliente/prestamos_index).
// La configuración del API (url, publickey) se toma del catálogo 18, como en el sistema actual.
import { Router } from "express";
import { pool } from "../../config/db.js";
import { verifyToken, requireCliente } from "../../middleware/auth.middleware.js";
import { ok } from "../../utils/responses.js";
import { AppError } from "../../utils/appError.js";

const router = Router();

const getConfigApi = async () => {
  const [[row]] = await pool.query(
    "SELECT descripcion FROM catalogo WHERE catalogo_tipo_id = 18 AND IFNULL(borrado,0) = 0 LIMIT 1",
  );
  try {
    return JSON.parse(row?.descripcion || "null");
  } catch {
    return null;
  }
};

/**
 * Cliente::cosultarApi. En el sistema actual la "desencriptación" termina siendo un base64
 * (la clase encriptacion pierde la llave por un `if($llave = "")`), así que se replica igual.
 */
const consultarContratos = async (url, rfc, publicKey) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `publicKey=${publicKey}&rfc=${rfc}`,
      signal: controller.signal,
    });
    const json = JSON.parse(await res.text());
    if (Number(json?.success) !== 1) return [];
    const texto = Buffer.from(String(json.data || ""), "base64").toString("utf8");
    const data = JSON.parse(texto || "[]");
    return Array.isArray(data) ? data : Object.values(data || {});
  } catch (error) {
    console.error("[prestamos] API de contratos:", error.message);
    throw new AppError("No fue posible consultar tus préstamos en este momento", 502);
  } finally {
    clearTimeout(timer);
  }
};

router.get("/", verifyToken, requireCliente, async (req, res, next) => {
  try {
    const [[cliente]] = await pool.query("SELECT rfc FROM cliente WHERE id = ? LIMIT 1", [req.user.cliente_id]);
    const config = await getConfigApi();
    if (!cliente?.rfc || !config?.url) return ok(res, [], "Préstamos");

    const contratos = await consultarContratos(`${config.url}getContratosByRfc/`, cliente.rfc, config.publickey);

    const data = contratos
      .map((c) => ({
        id: c.Id,
        producto: c.ContractTypeName,
        fecha: c.MDate,
        monto: Number(c.Quantity || 0),
        plazo: c.Duration,
        tipo_duracion: c.tipoDuracion,
        periodicidad: c.periodicidad,
        pago: Number(c.MinMonthlyPayment || 0),
        pago_inicial: c.PayInit,
        saldo: Number(c.saldo || 0),
        pagos_totales: Number(c.no_pagos_totales || 0),
        pagos_realizados: Number(c.no_pagos_realizados || 0),
        pagos_pendientes: Number(c.no_pagos_pendietes || 0),
        estatus: c.CStatus,
      }))
      .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));

    return ok(res, data, "Préstamos");
  } catch (error) {
    return next(error);
  }
});

export default router;
