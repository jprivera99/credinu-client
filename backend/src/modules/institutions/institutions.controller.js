import { ok } from "../../utils/responses.js";
import {
    getInstitutionsService,
    getInstitutionByIdService
} from "./institutions.service.js";

export const getInstitutions = async (req, res, next) => {
    try {
        const data = await getInstitutionsService();
        res.status(200).json(ok(data));
    } catch (error) {
        next(error);
    }
};

export const getInstitutionById = async (req, res, next) => {
    try {
        const data = await getInstitutionByIdService(req.params.id);
        res.status(200).json(ok(data));
    } catch (error) {
        next(error);
    }
};