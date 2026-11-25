import dotenv from 'dotenv';
dotenv.config();

const list = (value = '') =>
    String(value)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

export const env = {
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,

    // URL pública del portal (Next). Se usa para las ligas de regreso de REM y correos.
    frontUrl: (process.env.FRONT_URL || 'http://localhost:3000').replace(/\/+$/, ''),

    // Orígenes permitidos para CORS (separados por coma). Si está vacío se usa FRONT_URL.
    corsOrigins: list(process.env.CORS_ORIGINS),

};

if (!env.jwtSecret || env.jwtSecret.length < 32) {
    console.warn('[env] JWT_SECRET debe tener al menos 32 caracteres.');
}
if (!process.env.REM_WEBHOOK_URL) {
    console.warn('[env] REM_WEBHOOK_URL no configurado: REM no podrá avisar el resultado de la validación de INE.');
}
