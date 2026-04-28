import { pool } from "../../config/db.js";

export const cotizarService = async ({
  monto,
  ingreso,
  producto_id,
  institucion_id,
}) => {
  // 1. Traer productos de la institución
  const [productos] = await pool.query(`
    SELECT ip.*, p.nombre
    FROM institucion_producto ip
    JOIN producto p ON p.id = ip.producto_id
    WHERE ip.institucion_id = ?
    AND IFNULL(ip.borrado,0)=0
    AND IFNULL(ip.ocultar_cliente,0)=0
  `, [institucion_id]);

  if (!productos.length) return [];

  // 2. Filtrar por producto (si viene)
  let productosFiltrados = productos;

  if (producto_id) {
    productosFiltrados = productos.filter(
      (p) => p.producto_id == producto_id
    );
  }

  // 3. Simulación básica (MVP)
  const resultados = [];

  for (const prod of productosFiltrados) {
    const montoMax = Number(prod.monto_max);
    const montoMin = Number(prod.monto_min);

    // validar rango
    if (monto < montoMin || monto > montoMax) continue;

    const plazo = prod.plazo_max || 12;

    // cálculo simple (puedes mejorar luego)
    const tasa = Number(prod.tasa || 1.5);
    const pago = (monto * (1 + tasa / 100)) / plazo;

    resultados.push({
      producto_id: prod.producto_id,
      nombre: prod.nombre,
      monto_aprobado: monto,
      plazo,
      pago_periodico: Number(pago.toFixed(2)),
    });
  }

  return resultados;
};