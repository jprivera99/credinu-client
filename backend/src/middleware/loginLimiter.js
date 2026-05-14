import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 5, // solo 5 intentos
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        return res.status(429).json({
            message: "Demasiados intentos de login. Intenta nuevamente en unos minutos"
        });
    }
});