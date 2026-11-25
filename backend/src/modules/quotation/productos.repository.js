// src/modules/quotation/productos.repository.js
// Igual a Producto_model::getProductosPorInstitucion (perfil cliente: oculta ocultar_cliente = 1
// e incluye los productos de la institución padre).

import { pool } from "../../config/db.js";
import { comoMysqli } from "../../utils/phpJson.js";

export const getProductosPorInstitucion = async (institucionId, visitadas = new Set()) => {
  const id = Number(institucionId) || 0;
  if (visitadas.has(id)) return [];
  visitadas.add(id);

  const [filas] = await pool.query(
    "SELECT ip.* FROM institucion_producto ip WHERE ip.institucion_id = ? AND IFNULL(ip.borrado,0) = 0 AND IFNULL(ip.ocultar_cliente,0) = 0",
    [id],
  );
  // Igual que mysqli: los valores llegan como texto (así quedan en el JSON de la solicitud).
  const productos = filas.map(comoMysqli);

  const simIds = [...new Set(productos.map((p) => p.id_producto_simulador).filter((v) => v !== null && v !== undefined))];
  const sims = {};
  if (simIds.length) {
    const [rows] = await pool.query("SELECT * FROM simulador_producto WHERE id IN (?)", [simIds]);
    for (const r of rows) sims[r.id] = comoMysqli(r);
  }
  const [catalogo] = await pool.query("SELECT id, nombre FROM producto");
  const nombres = Object.fromEntries(catalogo.map((p) => [p.id, p.nombre]));

  for (const p of productos) {
    if (Number(p.producto_id) !== 0) {
      p.nombre = nombres[p.producto_id] ?? null;
      p.prod_simulador = p.id_producto_simulador !== null && p.id_producto_simulador !== undefined
        ? sims[p.id_producto_simulador] || null
        : null;
    } else {
      p.nombre = "";
    }
  }

  const [[inst]] = await pool.query("SELECT id_padre FROM institucion WHERE id = ? LIMIT 1", [id]);
  let padre = [];
  if (Number(inst?.id_padre) > 0) {
    padre = (await getProductosPorInstitucion(inst.id_padre, visitadas)).map((p) => ({ ...p, is_padre: true }));
  }
  return [...padre, ...productos];
};
