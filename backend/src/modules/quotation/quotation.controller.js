//src/modules/quotation.controller.js
import { ok } from "../../utils/responses.js";
import { cotizarService, detalleService } from "./quotation.service.js";

export const cotizar = async (req, res, next) => {
  try {
    const { monto, ingreso } = req.body;
    const data = await cotizarService({ user: req.user, monto, ingreso });
    return ok(res, data, "Cotización");
  } catch (error) {
    return next(error);
  }
};

export const getDetalle = async (req, res, next) => {
  try {
    const { monto, plazo, id, ingreso } = req.body;
    const data = await detalleService({ user: req.user, id, monto, plazo, ingreso });
    return ok(res, data, "Detalle de cotización");
  } catch (error) {
    return next(error);
  }
};
