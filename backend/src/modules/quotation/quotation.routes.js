import { Router } from "express";
import { cotizar, getDetalle } from "./quotation.controller.js";
import { verifyToken, authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/cotizar", verifyToken, authMiddleware, cotizar);
router.post("/detalle", verifyToken, authMiddleware, getDetalle);

export default router;