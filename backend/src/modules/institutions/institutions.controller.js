import { ok } from "../../utils/responses.js";
import {
  getInstitutionsService,
  getInstitutionByIdService,
} from "./institutions.service.js";

export const getInstitutions = async (req, res, next) => {
  try {
    const data = await getInstitutionsService();
    ok(res, data);
  } catch (error) {
    next(error);
  }
};

export const getInstitutionById = async (req, res, next) => {
  const id = req.query.id;

  console.log("ID recibido:", id);

  try {
    const data = await getInstitutionByIdService(id);
    ok(res, data);
  } catch (error) {
    next(error);
  }
};
