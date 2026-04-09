import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const verifyToken = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "No autorizado"
            });
        }

        // formato: Bearer TOKEN
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token inválido"
            });
        }

        const decoded = jwt.verify(token, env.jwtSecret);

        // AQUÍ guardamos el usuario
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Token inválido o expirado"
        });
    }
};