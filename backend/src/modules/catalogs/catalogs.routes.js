import { Router } from "express";
import { verifyToken, requireCliente } from "../../middleware/auth.middleware.js";
import { ok } from "../../utils/responses.js";
import {
  getSolicitudCatalogsService,
  getSepomexByCpService,
  validarClabeService,
} from "./catalogs.service.js";

const router = Router();

router.use(verifyToken, requireCliente);

router.get("/solicitud", async (req, res, next) => {
  try {
    return ok(res, await getSolicitudCatalogsService({ tipoProducto: req.query.tipo_producto }));
  } catch (error) {
    return next(error);
  }
});

router.get("/sepomex/:cp", async (req, res, next) => {
  try {
    return ok(res, await getSepomexByCpService(req.params.cp));
  } catch (error) {
    return next(error);
  }
});

router.get("/clabe/:clabe", async (req, res, next) => {
  try {
    return ok(res, await validarClabeService(req.params.clabe));
  } catch (error) {
    return next(error);
  }
});

export default router;
