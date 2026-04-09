import { Router } from "express";
import { body } from "express-validator";
import { login } from "./auth.controller.js";
import { register } from "./auth.controller.js";
import { loginLimiter } from "../../middleware/loginLimiter.js";

const router = Router();

router.post(
    "/login",
    [
        body("usuario").notEmpty().withMessage("Usuario requerido"),
        body("password").isLength({ min: 4 }).withMessage("Password inválido")
    ],
    login
);

router.post("/register", register);

export default router;