import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import {
  getApplications,
  createApplication,
  getApplicationById,
  getPrestamoExpress,
  updateApplication,
  finalizeApplication,
} from "./applications.controller.js";

const router = Router();
router.get("/", verifyToken, getApplications);
router.post("/create", verifyToken, createApplication);
router.get("/consulta/:id", verifyToken, getApplicationById);
router.patch("/consulta/:id", verifyToken, updateApplication);
router.get("/prestamo-express/:id", verifyToken, getPrestamoExpress);
router.post("/finalizar/:id", verifyToken, finalizeApplication);

export default router;
