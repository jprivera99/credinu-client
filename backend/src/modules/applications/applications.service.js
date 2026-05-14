import { pool } from "../../config/db.js";
import { cotizarService } from "../quotation/quotation.service.js";

function getProductNameFromAmortizacion(amortizacion) {
  try {
    const parsed = JSON.parse(amortizacion);
    return parsed?.info?.nombre_comercial || null;
  } catch (error) {
    return null;
  }
}

export const getApplicationsByAuthenticatedUser = async (userId) => {
  const [rows] = await pool.query(
    `SELECT 
      s.id,
      s.estatus_id,
      c.nombre AS estatus_nombre,
      s.registro_fecha AS fecha_registro,
      s.monto_credito,
      s.amortizacion
   FROM sis_usuario su
   INNER JOIN solicitud s 
      ON s.cliente_id = su.cliente_id
      AND IFNULL(s.borrado, 0) = 0
    LEFT JOIN catalogo c
      ON c.id = s.estatus_id
      AND c.catalogo_tipo_id = 5
   WHERE su.id = ?
   ORDER BY s.id DESC`,
    [userId],
  );

  return rows.map((row) => ({
    id: row.id,
    estatus_id: row.estatus_id,
    fecha_registro: row.fecha_registro,
    monto_credito: row.monto_credito ?? 0,
    producto: getProductNameFromAmortizacion(row.amortizacion),
    estatus: row.estatus_nombre ?? null,
  }));
};

export const createApplicationService = async ({
  cliente_id,
  monto,
  ingreso,
  plazo,
  institucion_producto_id,
  institucion_id,
}) => {
  /*
    VALIDAR
    */

  if (!institucion_producto_id || Number(institucion_producto_id) <= 0) {
    throw new Error("Producto requerido");
  }

  if (!monto || Number(monto) <= 0) {
    throw new Error("Monto inválido");
  }

  if (!ingreso || Number(ingreso) <= 0) {
    throw new Error("Ingreso inválido");
  }

  if (!plazo || Number(plazo) <= 0) {
    throw new Error("Plazo inválido");
  }

  /*
    COTIZAR PRODUCTOS
    */

  const productos = await cotizarService({
    monto: Number(monto),
    ingreso: Number(ingreso),
    institucion_id,
    cliente_id,
  });

  /*
    BUSCAR PRODUCTO
    */

  const producto = productos.find(
    (p) => Number(p.id) === Number(institucion_producto_id),
  );

  if (!producto) {
    throw new Error("Producto inválido");
  }

  console.log("PRODUCTO ENCONTRADO:", producto);

  console.log({
    cliente_id,
    institucion_producto_id,
    tipo_credito: producto.producto_id,
    monto_credito: producto.monto_aprobado,
    plazo,
    monto_pago: producto.pago_periodico,
    monto_total: producto.pago_periodico * plazo,
  });

  /*
    CREAR SOLICITUD
    */

  const amortizacion = JSON.stringify({
    info: producto,
    amortizacion: {
      tabla: producto.tabla || [],
    },
  });

  const [result] = await pool.query(
    `
    INSERT INTO solicitud (
      cliente_id,
      estatus_id,
      estatus,
      institucion_producto_id,
      tipo_credito,
      monto_credito,
      plazo_meses,
      monto_pago,
      monto_total,
      amortizacion,
      registro_fecha
    ) VALUES (
      ?,
      680,
      680,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      NOW()
    )
    `,
    [
      cliente_id,
      institucion_producto_id,
      producto.producto_id,
      producto.monto_aprobado,
      plazo,
      producto.pago_periodico,
      producto.pago_periodico * plazo,
      amortizacion,
    ],
  );

  return {
    solicitud_id: result.insertId,
  };
};

export const getApplicationByIdService = async ({ solicitud_id, user_id }) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id,
      s.estatus_id,
      s.monto_credito,
      s.plazo_meses,
      s.monto_pago,
      s.monto_total,
      s.registro_fecha,
      s.amortizacion,

      c.nombre AS estatus

    FROM solicitud s

    INNER JOIN sis_usuario su
      ON su.cliente_id = s.cliente_id

    LEFT JOIN catalogo c
      ON c.id = s.estatus_id
      AND c.catalogo_tipo_id = 5

    WHERE s.id = ?
      AND su.id = ?

    LIMIT 1
    `,
    [solicitud_id, user_id],
  );

  if (!rows.length) {
    throw new Error("Solicitud no encontrada");
  }

  const solicitud = rows[0];

  /*
    PARSEAR AMORTIZACION
  */

  let amortizacion = {};

  try {
    amortizacion = JSON.parse(solicitud.amortizacion || "{}");
  } catch (error) {
    amortizacion = {};
  }

  return {
    id: solicitud.id,

    estatus_id: solicitud.estatus_id,

    estatus: solicitud.estatus,

    monto_credito: solicitud.monto_credito,

    plazo_meses: solicitud.plazo_meses,

    monto_pago: solicitud.monto_pago,

    monto_total: solicitud.monto_total,

    fecha_registro: solicitud.registro_fecha,

    producto: amortizacion?.info?.nombre_comercial || null,

    tabla:
      amortizacion?.info?.detalle?.payments ||
      amortizacion?.amortizacion?.tabla ||
      [],
  };
};
