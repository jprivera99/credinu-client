import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
    loginValidator,
    changePasswordValidator,
    changePasswordRecoveryValidator,
    sendRecoverPasswordValidator,
} from "./auth.validators.js";
import {
    login,
    me,
    changePassword,
    changePasswordRecovery,
    sendRecoverPassword,
} from "./auth.controller.js";
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

router.post("/change-password", verifyToken, changePasswordValidator, validateRequest, changePassword);
router.post("/change-password/recovery", changePasswordRecoveryValidator, validateRequest, changePasswordRecovery);
router.post("/send-recover-password", sendRecoverPasswordValidator, validateRequest, sendRecoverPassword);

export default router;