import { Router } from "express";
import {
  preRegister,
  validateEmail,
  validatePhone,
  validateRFCController,
  validateSMS,
  sendCode,
  validateCode,
  validateRegister,
  calcularRFCController,
  calcularCURPController
} from "./register.controller.js";

const router = Router();

router.post("/pre-register", preRegister);
router.get("/validate-email", validateEmail);
router.get("/validate-phone", validatePhone);
router.get("/validate-rfc", validateRFCController);
router.post("/validate-sms", validateSMS);
router.post("/send-code", sendCode);
router.post("/validate-code", validateCode);
router.post("/validate", validateRegister);
router.post("/send-rfc", calcularRFCController);
router.post("/send-curp", calcularCURPController);

export default router;