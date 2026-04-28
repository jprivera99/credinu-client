import { Router } from "express";
import { cotizar } from "./quotation.controller.js";
import { verifyToken, authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/cotizar", verifyToken, authMiddleware, cotizar);

export default router;