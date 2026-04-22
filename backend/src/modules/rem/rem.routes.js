import { Router } from "express";
import { sendCode, validateCode} from "./rem.controller.js";

const router = Router();

router.post("/send-code", sendCode);
router.post("/validate-code", validateCode);

export default router;