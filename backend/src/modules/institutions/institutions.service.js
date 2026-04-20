import { pool } from "../../config/db.js";
import crypto from "crypto";

export const getInstitutionsService = async () => {
    const [rows] = await pool.query("SELECT id, nombre FROM institucion WHERE id_padre = 0 AND borrado = 0");
    return rows;
}

export const getInstitutionByIdService = async (id) => {
    const [rows] = await pool.query("SELECT * FROM institucion WHERE id = ? AND borrado = 0", [id]);
    if (rows.length === 0) {
        throw new Error("Institución no encontrada");
    }
    return rows[0];
}

