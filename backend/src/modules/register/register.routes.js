import { Router } from "express";
import {
  preRegister,
  validateSMS,
  sendCode,
  validateCode,
  validateRegister,
  calcularRFCController,
  calcularCURPController
} from "./register.controller.js";

const router = Router();

router.post("/pre-register", preRegister);
router.post("/validate-sms", validateSMS);
router.post("/send-code", sendCode);
router.post("/validate-code", validateCode);
router.post("/validate-register", validateRegister);
router.post("/send-rfc", calcularRFCController);
router.post("/send-curp", calcularCURPController);

export default router;