import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { getMe, updateMe } from "./user.controller.js";

const router = Router();

router.get("/me", verifyToken, getMe);
router.patch("/me", verifyToken, updateMe);

export default router;