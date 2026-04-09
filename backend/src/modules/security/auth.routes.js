import { Router } from "express";
import { login } from "./auth.controller.js";
import { register } from "./auth.controller.js";
import { loginLimiter } from "../../middleware/loginLimiter.js";

const router = Router();

router.post("/login", loginLimiter, login);
router.post("/register", register);

export default router;