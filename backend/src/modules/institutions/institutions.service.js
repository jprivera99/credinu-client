import { pool } from "../../config/db.js";
import crypto from "crypto";

export const getInstitutionsService = async () => {
    const [rows] = await pool.query("SELECT id, nombre FROM institucion WHERE id_padre = 0 AND borrado = 0 ORDER BY nombre");
    return rows;
}

export const getInstitutionByIdService = async (id) => {
  const [institucion] = await pool.query(
    "SELECT id, nombre FROM institucion WHERE id = ? AND borrado = 0 ORDER BY nombre",
    [id]
  );

  if (!institucion || institucion.length === 0) {
    throw new Error(`Institución no encontrada con id ${id}`);
  }

  const [hijas] = await pool.query(
    "SELECT id, nombre FROM institucion WHERE id_padre = ? AND borrado = 0 ORDER BY nombre",
    [id]
  );

  return {
    ...institucion[0],
    empresas_hijas: hijas,
  };
};
