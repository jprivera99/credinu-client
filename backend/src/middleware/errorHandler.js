import { fail } from '../utils/responses.js';

export const errorHandler = (error, req, res, next) => {
    console.error("ERROR DETALLADO:", error);
    const statusCode = error.statusCode || 500;

    return fail(
        res, 
        error.message || "Error interno del servidor", 
        statusCode, 
        error.details || null
    );
};