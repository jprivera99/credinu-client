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

    const data = await createApplicationService({
      userId: req.user.id,
      body: req.body,
      institucion_id
    });

    return ok(res, data, "Solicitud creada");
  } catch (error) {
    return next(error);
  }
};
