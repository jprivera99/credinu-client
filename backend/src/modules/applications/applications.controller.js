//src/modules/applications.controller.js

import { ok } from "../../utils/responses.js";
import {
  getApplicationsByAuthenticatedUser,
  createApplicationService,
  getApplicationByIdService,
  validateApplicationService,
  updateApplicationSectionService,
  autorizarBuroService,
  cancelApplicationService,
  finalizeApplicationService,
  completeApplicationService,
  signApplicationService,
  signedContractService,
} from "./applications.service.js";

const handle = (fn, message = "OK") => async (req, res, next) => {
  try {
    return ok(res, await fn(req), message);
  } catch (error) {
    return next(error);
  }
};

export const getApplications = handle((req) => getApplicationsByAuthenticatedUser(req.user), "Solicitudes obtenidas");

export const createApplication = async (req, res, next) => {
  try {
    const { monto, ingreso, plazo, institucion_producto_id, validar } = req.body;

    const validation = await validateApplicationService({
      cliente_id: req.user.cliente_id,
      institucion_producto_id: Number(institucion_producto_id),
    });

    if (!validation.success) {
      return res.status(400).json(validation);
    }

    if (Boolean(validar)) {
      return ok(res, { valid: true, express: Number(validation.express || 0) }, "Validación correcta");
    }

    const data = await createApplicationService({
      user: req.user,
      monto: Number(monto),
      ingreso: Number(ingreso),
      plazo: Number(plazo),
      institucion_producto_id: Number(institucion_producto_id),
    });

    return ok(res, data, "Solicitud creada");
  } catch (error) {
    return next(error);
  }
};

export const getApplicationById = handle(
  (req) => getApplicationByIdService({ solicitud_id: req.params.id, user: req.user }),
  "Solicitud obtenida",
);

export const updateApplicationSection = handle(
  (req) =>
    updateApplicationSectionService({
      solicitud_id: req.params.id,
      user: req.user,
      seccion: req.params.seccion,
      datos: req.body,
    }),
  "Información guardada",
);

export const authorizeBuro = handle(
  (req) => autorizarBuroService({ solicitud_id: req.params.id, user: req.user, password: req.body?.password }),
  "Autorización registrada",
);

export const cancelApplication = handle(
  (req) => cancelApplicationService({ solicitud_id: req.params.id, user: req.user }),
  "Solicitud cancelada",
);

export const finalizeApplication = handle(
  (req) => finalizeApplicationService({ solicitud_id: req.params.id, user: req.user }),
  "Solicitud en envío",
);

export const completeApplication = handle(
  (req) =>
    completeApplicationService({
      solicitud_id: req.params.id,
      user: req.user,
      workflow: req.body?.workflow,
      workflow_status: req.body?.workflow_status,
      last_step: req.body?.last_step,
    }),
  "Proceso de validación terminado",
);

export const signApplication = handle(
  (req) => signApplicationService({ solicitud_id: req.params.id, user: req.user }),
  "Liga de firma",
);

export const signedContract = handle(
  (req) => signedContractService({ solicitud_id: req.params.id, user: req.user }),
  "Contrato firmado",
);
