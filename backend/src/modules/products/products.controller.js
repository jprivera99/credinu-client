import { ok } from "../../utils/responses.js";
import { getProductsByAuthenticatedUser } from "./products.service.js";

export const getProducts = async (req, res, next) => {
    try {
        const data = await getProductsByAuthenticatedUser(req.user.id);
        return ok(res, data, "Productos obtenidos");
    } catch (error) {
        return next(error);
    }
};