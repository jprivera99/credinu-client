import { json } from "express";
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
    [userId],
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
      row.disponible_desde_dia,
    ),
  }));
};

export const getProductByInstitution = async (institucion_id) => {
  const [productosInstitucion] = await pool.query(
    `
    SELECT * 
    FROM institucion_producto
    WHERE institucion_id = ? 
    AND IFNULL(borrado,0)=0
    AND IFNULL(ocultar_cliente,0)=0
  `,
    [institucion_id],
  );

  if (!productosInstitucion.length) return [];

  const [productos] = await pool.query(`SELECT * FROM producto`);
  const mapProductos = {};

  productos.forEach((p) => {
    mapProductos[p.id] = p;
  });

  for (let prod of productosInstitucion) {
    if (prod.producto_id && mapProductos[prod.producto_id]) {
      prod.nombre = mapProductos[prod.producto_id].nombre;
    } else {
      prod.nombre = "";
    }

    if (prod.id_producto_simulador) {
      const [simulador] = await pool.query(
        `
        SELECT * FROM simulador_producto WHERE id = ?
      `,
        [prod.id_producto_simulador],
      );

      prod.prod_simulador = simulador?.[0] || null;
    } else {
      prod.prod_simulador = null;
    }
  }

  return productosInstitucion;
  console.log("Productos por institución:", json(productosInstitucion));
};

export const getProductByInstitutionQuotation = async (institucion_id) => {
  const [rows] = await pool.query(
    `
    SELECT
        ip.id, 
        ip.institucion_id, 
        ip.producto_id, 
        ip.tasa, 
        ip.comision_apertura, 
        ip.tasa_renovacion, 
        ip.periodicidad, 
        ip.plazo_max, 
        ip.plazo_min, 
        ip.monto_max, 
        ip.monto_min, 
        ip.antiguedad,
        ip.pago_gracia, 
        ip.borrado, 
        p.nombre, 
        p.descripcion
    FROM institucion_producto ip
    INNER JOIN producto p ON ip.producto_id = p.id
    WHERE IFNULL(ip.borrado,0) = 0 
    AND ip.institucion_id = ?
    `,
    [institucion_id]
  );
  
  const productos = {};

  rows.forEach((row) => {
    productos[row.producto_id] = row;
  });

  return productos;
};