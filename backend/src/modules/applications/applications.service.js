import { pool } from "../../config/db.js";
import {
  cotizarService,
  detalleService,
} from "../quotation/quotation.service.js";

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
    SOLICITUDES EN PROCESO
  */

  const [solicitudesProceso] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM solicitud
    WHERE cliente_id = ?
      AND IFNULL(borrado,0)=0
      AND estatus_id IN (680,681,682)
    `,
    [cliente_id],
  );

  const sol_proceso = Number(solicitudesProceso[0]?.total || 0);

  /*
    SOLICITUD VIGENTE
  */

  const [solicitudVigente] = await pool.query(
    `
    SELECT id
    FROM solicitud
    WHERE cliente_id = ?
      AND IFNULL(borrado,0)=0
      AND estatus_id = 679
    ORDER BY id DESC
    LIMIT 1
    `,
    [cliente_id],
  );

  const sol_vigente = solicitudVigente[0]?.id || 0;

  /*
    VALIDACION RH
  */

  const [clientes] = await pool.query(
    `
    SELECT
      IFNULL(validado,0) AS validado
    FROM cliente
    WHERE id = ?
    LIMIT 1
    `,
    [cliente_id],
  );

  const cliente = clientes[0];

  const alerta = Number(cliente?.validado || 0);

  /*
    PRODUCTO
  */

  const [productosDb] = await pool.query(
    `
    SELECT
      IFNULL(requiere_autorizacion_rh,0) AS requiere_autorizacion_rh,
      IFNULL(express,0) AS express
    FROM institucion_producto
    WHERE id = ?
    LIMIT 1
    `,
    [institucion_producto_id],
  );

  const productoDb = productosDb[0];

  const alerta_2 = Number(productoDb?.requiere_autorizacion_rh || 0);

  const is_express = Number(productoDb?.express || 0);

  /*
    VALIDACIONES RH
  */

  if (alerta !== 2 && alerta_2 === 0) {
    if (alerta === 3) {
      throw new Error(
        "Estimado Cliente: Su solicitud ha sido rechazada, favor de contactar al área de Recursos Humanos de su empresa para cualquier aclaración.",
      );
    }

    throw new Error(
      "Estimado Cliente podrás solicitar tu préstamo una vez que Recursos Humanos haya validado tu información.",
    );
  }

  /*
    SOLICITUD EN PROCESO
  */

  if (sol_proceso > 0) {
    throw new Error(
      "Tiene actualmente solicitudes en proceso de revisión. No puede enviar más solicitudes hasta que finalice las actuales.",
    );
  }

  /*
    SOLICITUD VIGENTE
  */

  if (sol_vigente > 0) {
    throw new Error("Tiene usted una solicitud pendiente sin enviar.");
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

  /*
    RECALCULAR DETALLE
  */

  const detalle = await detalleService({
    id: Number(institucion_producto_id),
    monto: Number(monto),
    plazo: Number(plazo),
    ingreso: Number(ingreso),
    institucion_id,
  });

  /*
    CREAR AMORTIZACION
  */

  const amortizacion = JSON.stringify({
    info: {
      ...producto,
      monto_aprobado: detalle.monto,
      plazo: detalle.plazo,
      pago_periodico: detalle.pago,
      periodicidad: detalle.periodicidad,
    },

    amortizacion: {
      tabla: detalle.tabla || [],
    },
  });

  /*
    CREAR SOLICITUD
  */

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
      detalle.monto,
      detalle.plazo,
      detalle.pago,
      detalle.total_pagar,
      amortizacion,
    ],
  );

  return {
    solicitud_id: result.insertId,
    express: is_express,
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

export const validateApplicationService = async ({
  cliente_id,
  institucion_producto_id,
}) => {
  /*
    OBTENER PRODUCTO
  */

  const [productoRows] = await pool.query(
    `
    SELECT
      id,
      express,
      requiere_autorizacion_rh
    FROM institucion_producto
    WHERE id = ?
    LIMIT 1
    `,
    [institucion_producto_id],
  );

  const producto = productoRows[0];

  if (!producto) {
    throw new Error("Producto no encontrado");
  }

  /*
    VALIDACION CLIENTE
  */

  const [clienteRows] = await pool.query(
    `
    SELECT
      IFNULL(validado,0) AS validado
    FROM cliente
    WHERE id = ?
    LIMIT 1
    `,
    [cliente_id],
  );

  const cliente = clienteRows[0];

  const alerta = Number(cliente?.validado || 0);

  /*
    VALIDAR RH
  */

  if (alerta !== 2 && Number(producto.requiere_autorizacion_rh) === 0) {
    return {
      success: false,
      type: "RH_VALIDATION",
      message:
        alerta === 3
          ? "Su solicitud ha sido rechazada por Recursos Humanos."
          : "Debe esperar validación de Recursos Humanos.",
    };
  }

  /*
    SOLICITUDES EN PROCESO
  */

  const [procesoRows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM solicitud
    WHERE cliente_id = ?
    AND IFNULL(borrado,0)=0
    AND estatus IN (680,690,700,710)
    `,
    [cliente_id],
  );

  const solicitudesProceso = Number(procesoRows[0]?.total || 0);

  if (solicitudesProceso > 0) {
    return {
      success: false,
      type: "PROCESS",
      message: "Actualmente tiene solicitudes en proceso de revisión.",
    };
  }

  /*
    SOLICITUD VIGENTE
  */

  const [vigenteRows] = await pool.query(
    `
    SELECT id
    FROM solicitud
    WHERE cliente_id = ?
    AND IFNULL(borrado,0)=0
    AND estatus = 100
    ORDER BY id DESC
    LIMIT 1
    `,
    [cliente_id],
  );

  const solicitudVigente = vigenteRows[0];

  if (solicitudVigente) {
    return {
      success: false,
      type: "PENDING",
      solicitud_id: solicitudVigente.id,
      message: "Tiene una solicitud pendiente.",
    };
  }

  /*
    TODO OK
  */

  return {
    success: true,
    express: Number(producto.express || 0),
  };
};
