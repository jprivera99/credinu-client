import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import registerRoutes from './modules/register/register.routes.js';
import institutionsRoutes from "./modules/institutions/institutions.router.js";
import productsRoutes from "./modules/products/products.routes.js";
import remRoutes from "./modules/rem/rem.routes.js";
import quotationRoutes from "./modules/quotation/quotation.routes.js";
import applicationRoutes from "./modules/applications/applications.routes.js";

const app = express();

// Cargar variables de entorno
dotenv.config();

// Seguridad básica
app.use(helmet());

// CORS (ajusta dominio en producción)
app.use(cors({
    origin: "*", // cambia a tu dominio
    credentials: true
}));

// Logs
app.use(morgan("dev"));

// Rate limit (ANTI ataques)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100, // máximo 100 requests por IP
    message: "Demasiadas peticiones, intenta más tarde"
});

app.use("/api", limiter);

// Evitar HTTP Parameter Pollution
app.use(hpp());

// Parse JSON
app.use(express.json({
    limit: "10kb" // evita payloads grandes (ataques)
}));

// Rutas
app.use("/api/v1", apiRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use("/api/rem", remRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/quotation", quotationRoutes);
app.use("/api/applications", applicationRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Test
app.get("/", (req, res) => {
    res.send("API segura funcionando");
});

// Start server
app.listen(env.port, () => {
    console.log(`Servidor seguro en puerto ${env.port}`);
});