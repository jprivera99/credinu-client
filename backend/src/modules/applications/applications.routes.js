import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import {
  getApplications,
  createApplication,
  getApplicationById,
} from "./applications.controller.js";

const router = Router();
router.get("/", verifyToken, getApplications);
router.post("/create", verifyToken, createApplication);
router.get("/consulta/:id", verifyToken, getApplicationById);

export default router;
