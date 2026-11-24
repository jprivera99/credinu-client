import express, { Router } from "express";
import { verifyToken, requireCliente } from "../../middleware/auth.middleware.js";
import { ok } from "../../utils/responses.js";
import { subirDocumentoService, verDocumentoService } from "./documents.service.js";

const router = Router();

router.use(verifyToken, requireCliente);

// Archivo en base64 (máx. 10 MB => ~14 MB en base64).
router.post("/", express.json({ limit: "15mb" }), async (req, res, next) => {
  try {
    const { tipo, nombre, base64 } = req.body || {};
    return ok(res, await subirDocumentoService({ user: req.user, tipo, nombre, base64 }), "Documento guardado");
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/archivo", async (req, res, next) => {
  try {
    return ok(res, await verDocumentoService({ user: req.user, documento_id: req.params.id }));
  } catch (error) {
    return next(error);
  }
});

export default router;
