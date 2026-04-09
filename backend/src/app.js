import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { env } from "./config/env.js";
import authRoutes from "./modules/security/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";

const app = express();

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
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Test
app.get("/", (req, res) => {
    res.send("API segura funcionando 🔐");
});

// Start server
app.listen(env.port, () => {
    console.log(`Servidor seguro en puerto ${env.port}`);
});