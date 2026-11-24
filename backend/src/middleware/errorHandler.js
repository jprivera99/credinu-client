import { fail } from '../utils/responses.js';

export const errorHandler = (error, req, res, next) => {
    console.error("ERROR DETALLADO:", error);
    const statusCode = error.statusCode || error.status || 500;

    // Los errores no controlados (BD, código) no se muestran al cliente tal cual.
    const message = statusCode >= 500 && !error.statusCode
        ? "Ocurrió un error inesperado. Intenta de nuevo."
        : error.message || "Error interno del servidor";

    return fail(res, message, statusCode, error.details || null);
};
