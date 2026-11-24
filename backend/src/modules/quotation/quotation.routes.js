import { Router } from "express";
import { verifyToken, requireCliente } from "../../middleware/auth.middleware.js";
import { cotizar, getDetalle } from "./quotation.controller.js";

const router = Router();

router.post("/cotizar", verifyToken, requireCliente, cotizar);
router.post("/detalle", verifyToken, requireCliente, getDetalle);

export default router;
