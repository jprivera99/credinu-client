import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { getPerfil } from "./user.controller.js";

const router = Router();

router.get("/perfil", verifyToken, getPerfil);

export default router;