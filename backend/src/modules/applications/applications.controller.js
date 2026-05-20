//src/modules/applications.controller.js

import { ok } from "../../utils/responses.js";
import {
  getApplicationsByAuthenticatedUser,
  createApplicationService,
  getApplicationByIdService,
  validateApplicationService,
  getPrestamoExpressService,
  updateApplicationService,
  finalizeApplicationService,
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
    const cliente_id = req.user.cliente_id;

    const { monto, ingreso, plazo, institucion_producto_id, validar } =
      req.body;

    const validation = await validateApplicationService({
      cliente_id,
      institucion_producto_id,
    });

    if (!validation.success) {
      return res.status(400).json(validation);
    }

    // Si solo se está validando, no se crea solicitud.
    if (Boolean(validar)) {
      return ok(
        res,
        {
          valid: true,
          express: Number(validation?.express || 0),
        },
        "Validación correcta",
      );
    }

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

export const getApplicationById = async (req, res, next) => {
  try {
    const data = await getApplicationByIdService({
      solicitud_id: req.params.id,
      user_id: req.user.id,
    });

    return ok(res, data, "Solicitud obtenida");
  } catch (error) {
    return next(error);
  }
};

export const getPrestamoExpress = async (req, res, next) => {
  try {
    const data = await getPrestamoExpressService({
      solicitud_id: req.params.id,
      user_id: req.user.id,
    });

    return ok(res, data, "Prestamo express obtenido");
  } catch (error) {
    return next(error);
  }
};

export const updateApplication = async (req, res, next) => {
  try {
    const data = await updateApplicationService({
      solicitud_id: req.params.id,

      user_id: req.user.id,

      body: req.body,
    });

    return ok(res, data, "Solicitud actualizada");
  } catch (error) {
    next(error);
  }
};

export const finalizeApplication = async (req, res) => {
  try {
    const response = await finalizeApplicationService({
      solicitud_id: req.params.id,

      user_id: req.user.id,
    });

    return res.json(response);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
