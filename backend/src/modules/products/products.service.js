import { pool } from "../../config/db.js";

function buildAvailabilityLabel(month, day) {
    if (!month || !day) return null;
    const year = new Date().getFullYear();
    const date = new Date(year, Number(month) - 1, Number(day));

    if (Number.isNaN(date.getTime())) return null;
    return "Disponible a partir del " + date.toLocaleDateString("es-MX");
}

export const getProductsByAuthenticatedUser = async (userId) => {
    const [rows] = await pool.query(
        `
        SELECT
            ip.id,
            ip.nombre_comercial,
            ip.descripcion,
            sp.disponible_desde_mes,
            sp.disponible_desde_dia
        FROM sis_usuario su
        INNER JOIN cliente c ON c.id = su.cliente_id
        INNER JOIN institucion_producto ip
            ON ip.institucion_id = c.institucion_id
           AND IFNULL(ip.borrado, 0) = 0
           AND IFNULL(ip.ocultar_cliente, 0) = 0
        LEFT JOIN simulador_producto sp
            ON sp.id = ip.id_producto_simulador
        WHERE su.id = ?
        ORDER BY ip.id DESC
        `,
        [userId]
    );
    return rows.map((row) => ({
        id: row.id, 
        nombre_comercial: row.nombre_comercial,
        descripcion: String(row.descripcion || "")
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean),
        disponibilidad: buildAvailabilityLabel(
            row.disponible_desde_mes, 
            row.disponible_desde_dia
        ),

    }));
};