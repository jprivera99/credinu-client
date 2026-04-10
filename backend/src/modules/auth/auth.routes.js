import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validateRequest.middleware.js";
import { loginValidator } from "./auth.validators.js";
import { changePasswordValidator } from "./auth.validators.js";
import { body } from "express-validator";
import { login, me, changePassword } from "./auth.controller.js";
import { register } from "./auth.controller.js";
import { loginLimiter } from "../../middleware/loginLimiter.js";

const router = Router();

router.post(
    "/login",
    loginLimiter,
    loginValidator,
    validateRequest,
    login
);

router.get("/me", verifyToken, me);

router.post(
    "/change-password",
    verifyToken,
    changePasswordValidator,
    validateRequest,
    changePassword
);

export default router;