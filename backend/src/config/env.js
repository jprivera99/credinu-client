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

    // Puente con el sistema actual (PHP): cotizador, REM, STP/Dispersa, contratos, S3, correos.
    bridgeUrl: (process.env.BRIDGE_URL || '').replace(/\/+$/, ''),
    bridgeToken: process.env.BRIDGE_TOKEN || '',
    bridgeTimeoutMs: Number(process.env.BRIDGE_TIMEOUT_MS || 60000),
};

if (!env.jwtSecret || env.jwtSecret.length < 32) {
    console.warn('[env] JWT_SECRET debe tener al menos 32 caracteres.');
}
if (!env.bridgeUrl || env.bridgeToken.length < 32) {
    console.warn('[env] BRIDGE_URL / BRIDGE_TOKEN no configurados: cotización, envío de solicitudes, documentos y préstamos no funcionarán.');
}
