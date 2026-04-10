import { ok } from "../../utils/responses.js";
import { getApplicationsByAuthenticatedUser } from "./applications.service.js";

export const getApplications = async (req, res, next) => {
    try {
        const data = await getApplicationsByAuthenticatedUser(req.user.id);
        return ok(res, data, "Solicitudes obtenidas");
    } catch (error) {
        return next(error);
    }
};