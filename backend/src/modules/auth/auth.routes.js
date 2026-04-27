import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
/* import { validateRequest } from "../../middleware/validateRequest.middleware.js"; */
import { loginValidator, changePasswordValidator} from "./auth.validators.js";
import { login, me, changePassword, sendRecoverPassword} from "./auth.controller.js";
import { loginLimiter } from "../../middleware/loginLimiter.js";

const router = Router();

router.post(
    "/login",
    loginLimiter,
    loginValidator,
    /* validateRequest, */
    login
);

router.get("/me", verifyToken, me);

router.post("/change-password",changePasswordValidator,changePassword);
router.post("/send-recover-password",changePasswordValidator,sendRecoverPassword);

export default router;