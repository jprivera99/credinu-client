import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
/* import { validateRequest } from "../../middleware/validateRequest.middleware.js"; */
import { loginValidator, changePasswordValidator } from "./auth.validators.js";
import { login, me, changePassword, register } from "./auth.controller.js";
import { loginLimiter } from "../../middleware/loginLimiter.js";

const router = Router();

router.post(
    "/login",
    loginLimiter,
    loginValidator,
    login
);

router.get("/me", verifyToken, me);

router.post(
    "/change-password",
    verifyToken,
    changePasswordValidator,
    changePassword
);

router.post("/register", register);

export default router;