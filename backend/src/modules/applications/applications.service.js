import { pool } from '../../config/db.js';

function getProductNameFromAmortizacion(amortizacion){
    try {
        const parsed = JSON.parse(amortizacion);
        return parsed?.info?.nombre_comercial || null;
    } catch (error) {
        return null;
    }
}

export const getApplicationsByAuthenticatedUser = async (userId) => {
    const [rows] = await pool.query(
        "SELECT   s.id,   s.estatus_id,   s.fecha_registro,   s.amortizacion FROM sis_usuario su INNER JOIN solicitud s   ON s.cliente_id = su.cliente_id  AND IFNULL(s.borrado, 0) = 0 WHERE su.id = ? ORDER BY s.id DESC",
        [userId]
    );
    return rows.map((row) => ({
        id: row.id,
        estatus_id: row.estatus_id,
        fecha_registro: row.fecha_registro,
        producto: getProductNameFromAmortizacion(row.amortizacion),
        estatus: row.estatus_id ? "Estatus " + row.estatus_id: null,
    }));
};