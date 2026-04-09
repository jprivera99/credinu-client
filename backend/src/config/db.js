import mysql from 'mysql2/promise';
import { env } from './env.js';

// Parsear DATABASE_URL
const url = new URL(env.databaseUrl);

export const pool = mysql.createPool({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    port: url.port || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test conexión (opcional pero recomendado)
(async () => {
    try {
        const conn = await pool.getConnection();
        console.log("Conectado a MySQL");
        conn.release();
    } catch (error) {
        console.error("Error conexión BD:", error.message);
    }
})();

// helper tipo pg
export async function query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
}