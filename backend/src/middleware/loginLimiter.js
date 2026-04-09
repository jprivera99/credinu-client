import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 5, // solo 5 intentos
    message: "Demasiados intentos de login"
});