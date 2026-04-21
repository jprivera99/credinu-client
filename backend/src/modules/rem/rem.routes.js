import { Router } from "express";
import { sendCode } from "./rem.controller.js";

const router = Router();

router.post("/send-code", sendCode);

export default router;