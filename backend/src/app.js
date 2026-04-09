import express from "express";
import { env } from "./config/env.js";
import authRoutes from "./modules/security/auth.routes.js";

const app = express();

// middlewares
app.use(express.json());

// rutas
app.use("/api/auth", authRoutes);

// prueba básica
app.get("/", (req, res) => {
    res.send("API funcionando correctamente");
});

app.listen(env.port, () => {
    console.log(`Servidor corriendo en puerto ${env.port}`);
});