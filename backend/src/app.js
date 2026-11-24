import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import registerRoutes from "./modules/register/register.routes.js";
import institutionsRoutes from "./modules/institutions/institutions.router.js";
import productsRoutes from "./modules/products/products.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import remRoutes from "./modules/rem/rem.routes.js";
import quotationRoutes from "./modules/quotation/quotation.routes.js";
import applicationRoutes from "./modules/applications/applications.routes.js";
import catalogsRoutes from "./modules/catalogs/catalogs.routes.js";
import documentsRoutes from "./modules/documents/documents.routes.js";
import loansRoutes from "./modules/loans/loans.routes.js";

const app = express();

// Detrás del balanceador: usar la IP real del cliente para el rate limit.
app.set("trust proxy", 1);

app.use(helmet());

// CORS: sólo el dominio del portal (CORS_ORIGINS o FRONT_URL).
const allowedOrigins = env.corsOrigins.length ? env.corsOrigins : [env.frontUrl];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  }),
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Límite general. Muchos empleados de una misma empresa pueden salir por la misma IP,
// por eso es más alto que antes (100); el login tiene su propio límite estricto.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 1000),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Demasiadas peticiones, intenta más tarde" },
  }),
);

app.use(hpp());

// JSON pequeño para todo, excepto la carga de documentos (tiene su propio límite en la ruta).
const jsonChico = express.json({ limit: "100kb" });
app.use((req, res, next) => {
  if (req.method === "POST" && req.path === "/api/documents") return next();
  return jsonChico(req, res, next);
});

app.get("/", (req, res) => res.send("API segura funcionando"));
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/institutions", institutionsRoutes);
app.use("/api/rem", remRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/quotation", quotationRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/catalogs", catalogsRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/loans", loansRoutes);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Servidor seguro en puerto ${env.port}`);
});
