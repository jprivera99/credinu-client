// Mis préstamos: contratos del cliente en el API externo (igual que Cliente/prestamos_index).
import { Router } from "express";
import { verifyToken, requireCliente } from "../../middleware/auth.middleware.js";
import { ok } from "../../utils/responses.js";
import { callBridge } from "../../utils/bridge.js";

const router = Router();

router.get("/", verifyToken, requireCliente, async (req, res, next) => {
  try {
    const contratos = (await callBridge("prestamos", req.user)) || [];
    const data = contratos.map((c) => ({
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
    }));
    return ok(res, data, "Préstamos");
  } catch (error) {
    return next(error);
  }
});

export default router;
