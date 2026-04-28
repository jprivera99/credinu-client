import { ok } from "../../utils/responses.js";
import {
  getProductsByAuthenticatedUser,
  getProductByInstitution,
} from "./products.service.js";

export const getProducts = async (req, res, next) => {
  try {
    const data = await getProductsByAuthenticatedUser(req.user.id);
    return ok(res, data, "Productos obtenidos");
  } catch (error) {
    return next(error);
  }
};

export const getProductsByinstitucions = async (req, res) => {
  try {
    const institucion_id = req.user.institucion_id;

    console.log("Institución:", institucion_id);

    const productos = await getProductByInstitution(institucion_id);

    console.log("Productos:", productos);

    res.json(productos);
  } catch (error) {
    console.error("ERROR REAL:", error);
    res.status(500).json({ message: error.message });
  }
};
