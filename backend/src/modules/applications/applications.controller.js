//src/modules/applications.controller.js

import { ok } from "../../utils/responses.js";
import {
  getApplicationsByAuthenticatedUser,
  createApplicationService,
} from "./applications.service.js";

export const getApplications = async (req, res, next) => {
  try {
    const data = await getApplicationsByAuthenticatedUser(req.user.id);

    return ok(res, data, "Solicitudes obtenidas");
  } catch (error) {
    return next(error);
  }
};

export const createApplication = async (req, res, next) => {
  try {
    const institucion_id = req.user.institucion_id;
    const cliente_id = req.user.id;

    const {
      monto,
      ingreso,
      plazo,
      institucion_producto_id,
    } = req.body;

    const data = await createApplicationService({
      cliente_id,
      monto: Number(monto),
      ingreso: Number(ingreso),
      plazo: Number(plazo),
      institucion_producto_id: Number(institucion_producto_id),
      institucion_id,
    });

    return ok(res, data, "Solicitud creada");
  } catch (error) {
    return next(error);
  }
};