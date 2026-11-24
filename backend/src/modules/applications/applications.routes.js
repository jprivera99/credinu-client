import { Router } from "express";
import { verifyToken, requireCliente } from "../../middleware/auth.middleware.js";
import {
  getApplications,
  createApplication,
  getApplicationById,
  updateApplicationSection,
  authorizeBuro,
  cancelApplication,
  finalizeApplication,
  completeApplication,
  signApplication,
  signedContract,
} from "./applications.controller.js";

const router = Router();

router.use(verifyToken, requireCliente);

router.get("/", getApplications);
router.post("/create", createApplication);

router.get("/:id", getApplicationById);
router.put("/:id/secciones/:seccion", updateApplicationSection);
router.post("/:id/buro", authorizeBuro);
router.post("/:id/cancelar", cancelApplication);

router.post("/:id/enviar", finalizeApplication);
router.post("/:id/completar", completeApplication);

router.post("/:id/firma", signApplication);
router.get("/:id/contrato", signedContract);

export default router;
