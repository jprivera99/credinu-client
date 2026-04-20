import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/user/user.routes.js";
import productsRoutes from "../modules/products/products.routes.js";
import applicationsRoutes from "../modules/applications/applications.routes.js";
import institutionsRoutes from "../modules/institutions/institutions.router.js";

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/products", productsRoutes);
router.use("/applications", applicationsRoutes);
router.use("/institutions", institutionsRoutes);

export default router;