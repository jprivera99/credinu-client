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

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Error JWT:", error);
    return res.status(401).json({ message: "Token inválido" });
  }
};
/*
| Sólo clientes (perfil 4) con cliente asociado. Se usa después de verifyToken.
*/
export const requireCliente = (req, res, next) => {
  if (Number(req.user?.perfil_id) !== 4 || Number(req.user?.cliente_id) <= 0) {
    return res.status(403).json({ success: false, message: "Usuario no autorizado para portal cliente" });
  }
  return next();
};
