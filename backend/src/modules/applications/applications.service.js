import { pool } from "../../config/db.js";
import {
  cotizarService,
  detalleService,
} from "../quotation/quotation.service.js";

import {
  syncPersonRemService,
  createWorkflowTokenRemService,
} from "../rem/rem.service.js";

import { createWorkflowRemService } from "../rem/rem.workflow.service.js";

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
    VALIDACIONES BASICAS
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
    FROM sis_usuario
    WHERE cliente_id = ?
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
          ? "Estimado Cliente: Su solicitud ha sido rechazada, favor de contactar al área de Recursos Humanos de su empresa para cualquier aclaración."
          : "Estimado Cliente podrás solicitar tu préstamo una vez que Recursos Humanos haya validado tu información. Por favor consulta tu correo electrónico.",
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
      message:
        "Tiene actualmente solicitudes en proceso de revisión. No puede enviar más solicitudes hasta que finalice las actuales. Para verificar el estado de sus solicitudes, vaya al menú 'Solicitudes de Crédito'.",
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
      message:
        "Tiene usted una Solicitud sin enviar. Para continuar puede editar la solicitud pendiente o cancelarla y crear una nueva.",
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
      s.referencias_json,

      cat.nombre AS estatus,

      cl.nombre,
      cl.apellido_paterno,
      cl.apellido_materno,
      cl.telefono_movil,
      cl.email,
      cl.curp,
      cl.rfc,
      cl.nacimiento_fecha,

      cl.domicilio_calle,
      cl.domicilio_calle_numext,
      cl.domicilio_calle_numint,
      cl.domicilio_colonia,
      cl.domicilio_municipio,
      cl.domicilio_estado,
      cl.domicilio_cp,

      cl.empleo_puesto,
      cl.empleo_Ingreso_neto_mensual,
      cl.empleo_antiguedad,

      cl.redes_sociales

    FROM solicitud s

    INNER JOIN sis_usuario su
      ON su.cliente_id = s.cliente_id

    INNER JOIN cliente cl
      ON cl.id = s.cliente_id

    LEFT JOIN catalogo cat
      ON cat.id = s.estatus_id
      AND cat.catalogo_tipo_id = 5

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
  | PARSEAR AMORTIZACION
  */

  let amortizacion = {};

  try {
    amortizacion = JSON.parse(solicitud.amortizacion || "{}");
  } catch (error) {
    amortizacion = {};
  }

  /*
  | PARSEAR REFERENCIAS
  */

  let referencias = [];

  try {
    const parsed = JSON.parse(solicitud.referencias_json || "{}");

    referencias = Object.keys(parsed).map((key) => ({
      nombre: parsed[key]?.nombre || "",

      parentesco: parsed[key]?.parentesco || "",

      telefono: parsed[key]?.telefono_movil || "",
    }));
  } catch (error) {
    referencias = [];
  }

  /*
  | PARSEAR REDES SOCIALES
  */

  let redes_sociales = {};

  try {
    redes_sociales = JSON.parse(solicitud.redes_sociales || "{}");
  } catch (error) {
    redes_sociales = {};
  }

  /*
  | RESPONSE
  */

  return {
    current_step: 1,

    cliente: {
      nombre: solicitud.nombre || "",

      apellido_paterno: solicitud.apellido_paterno || "",

      apellido_materno: solicitud.apellido_materno || "",

      telefono_movil: solicitud.telefono_movil || "",

      email: solicitud.email || "",

      curp: solicitud.curp || "",

      rfc: solicitud.rfc || "",

      fecha_nacimiento: solicitud.nacimiento_fecha,
    },

    domicilio: {
      calle: solicitud.domicilio_calle || "",

      numero_exterior: solicitud.domicilio_calle_numext || "",

      numero_interior: solicitud.domicilio_calle_numint || "",

      colonia: solicitud.domicilio_colonia || "",

      municipio: solicitud.domicilio_municipio || "",

      estado: solicitud.domicilio_estado || "",

      codigo_postal: solicitud.domicilio_cp || "",
    },

    laboral: {
      puesto: solicitud.empleo_puesto || "",

      ingreso_mensual: solicitud.empleo_Ingreso_neto_mensual || 0,

      antiguedad: solicitud.empleo_antiguedad || "",
    },

    referencias,

    redes_sociales,

    solicitud: {
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
    },
  };
};

export const getPrestamoExpressService = async ({ solicitud_id, user_id }) => {
  /*
    OBTENER SOLICITUD
  */

  const [solicitudRows] = await pool.query(
    `
    SELECT
      s.*,
      c.id AS cliente_id,
      c.nombre,
      c.apellido_paterno,
      c.apellido_materno,
      c.email
    FROM solicitud s
    INNER JOIN cliente c
      ON c.id = s.cliente_id
    INNER JOIN sis_usuario su
      ON su.cliente_id = c.id
    WHERE s.id = ?
      AND su.id = ?
    LIMIT 1
    `,
    [solicitud_id, user_id],
  );

  if (!solicitudRows.length) {
    throw new Error("Solicitud no encontrada");
  }

  const solicitud = solicitudRows[0];

  /*
    PARSEAR AMORTIZACION
  */

  let amortizacion = {};

  try {
    amortizacion = JSON.parse(solicitud.amortizacion || "{}");
  } catch (error) {
    amortizacion = {};
  }

  /*
    CATALOGOS
  */

  const [estados] = await pool.query(`
    SELECT id, nombre
    FROM catalogo
    WHERE catalogo_tipo_id = 1
  `);

  /*
    DOCUMENTOS
  */

  const [documentos] = await pool.query(
    `
    SELECT *
    FROM documento
    WHERE solicitud_id = ?
    `,
    [solicitud_id],
  );

  /*
    RESPUESTA FINAL
  */

  return {
    solicitud: {
      id: solicitud.id,
      monto_credito: solicitud.monto_credito,
      plazo_meses: solicitud.plazo_meses,
      monto_pago: solicitud.monto_pago,
    },

    cliente: {
      id: solicitud.cliente_id,
      nombre: solicitud.nombre,
      apellido_paterno: solicitud.apellido_paterno,
      apellido_materno: solicitud.apellido_materno,
      email: solicitud.email,
    },

    producto: amortizacion?.info || null,

    tabla: amortizacion?.amortizacion?.tabla || [],

    catalogos: {
      estados,
    },

    documentos,
  };
};

export const updateApplicationService = async ({
  solicitud_id,
  user_id,
  body,
}) => {
  /*
  | VALIDAR SOLICITUD
  */

  const [solicitudRows] = await pool.query(
    `
    SELECT
      s.id,
      s.cliente_id

    FROM solicitud s

    INNER JOIN sis_usuario su
      ON su.cliente_id = s.cliente_id

    WHERE s.id = ?
      AND su.id = ?

    LIMIT 1
    `,
    [solicitud_id, user_id],
  );

  if (!solicitudRows.length) {
    throw new Error("Solicitud no encontrada");
  }

  const solicitud = solicitudRows[0];

  /*
  | CLIENTE
  */

  if (body.cliente) {
    await pool.query(
      `
      UPDATE cliente
      SET
        nombre = ?,
        apellido_paterno = ?,
        apellido_materno = ?,
        telefono_movil = ?,
        email = ?,
        curp = ?,
        rfc = ?,
        nacimiento_fecha = ?

      WHERE id = ?
      `,
      [
        body.cliente.nombre || null,

        body.cliente.apellido_paterno || null,

        body.cliente.apellido_materno || null,

        body.cliente.telefono_movil || null,

        body.cliente.email || null,

        body.cliente.curp || null,

        body.cliente.rfc || null,

        body.cliente.fecha_nacimiento || null,

        solicitud.cliente_id,
      ],
    );
  }

  /*
  | DOMICILIO
  */

  if (body.domicilio) {
    await pool.query(
      `
      UPDATE cliente
      SET
        domicilio_calle = ?,
        domicilio_calle_numext = ?,
        domicilio_calle_numint = ?,
        domicilio_colonia = ?,
        domicilio_municipio = ?,
        domicilio_estado = ?,
        domicilio_cp = ?

      WHERE id = ?
      `,
      [
        body.domicilio.calle || null,

        body.domicilio.numero_exterior || null,

        body.domicilio.numero_interior || null,

        body.domicilio.colonia || null,

        body.domicilio.municipio || null,

        body.domicilio.estado || null,

        body.domicilio.codigo_postal || null,

        solicitud.cliente_id,
      ],
    );
  }

  /*
  | LABORAL
  */

  if (body.laboral) {
    await pool.query(
      `
      UPDATE cliente
      SET
        empleo_puesto = ?,
        empleo_Ingreso_neto_mensual = ?,
        empleo_antiguedad = ?

      WHERE id = ?
      `,
      [
        body.laboral.puesto || null,

        body.laboral.ingreso_mensual || 0,

        body.laboral.antiguedad || 0,

        solicitud.cliente_id,
      ],
    );
  }

  /*
  | REDES SOCIALES
  */

  if (body.redes_sociales) {
    await pool.query(
      `
      UPDATE cliente
      SET
        redes_sociales = ?

      WHERE id = ?
      `,
      [
        JSON.stringify({
          facebook: body.redes_sociales.facebook || "",

          linkedln: body.redes_sociales.linkedln || "",

          twitter: body.redes_sociales.twitter || "",

          instagram: body.redes_sociales.instagram || "",

          otros: body.redes_sociales.otros || "",
        }),

        solicitud.cliente_id,
      ],
    );
  }

  /*
  | REFERENCIAS
  */

  if (body.referencias) {
    await pool.query(
      `
      UPDATE solicitud
      SET
        referencias_json = ?

      WHERE id = ?
      `,
      [
        JSON.stringify({
          1: {
            nombre: body.referencias?.["1"]?.nombre || "",

            parentesco: body.referencias?.["1"]?.parentesco || "",

            telefono_movil: body.referencias?.["1"]?.telefono_movil || "",
          },

          2: {
            nombre: body.referencias?.["2"]?.nombre || "",

            parentesco: body.referencias?.["2"]?.parentesco || "",

            telefono_movil: body.referencias?.["2"]?.telefono_movil || "",
          },

          3: {
            nombre: body.referencias?.["3"]?.nombre || "",

            parentesco: body.referencias?.["3"]?.parentesco || "",

            telefono_movil: body.referencias?.["3"]?.telefono_movil || "",
          },
        }),

        solicitud.id,
      ],
    );
  }

  /*
  | STEP ACTUAL
  */

  if (body.current_step) {
    await pool.query(
      `
      UPDATE solicitud
      SET
        comentarios = ?

      WHERE id = ?
      `,
      [
        JSON.stringify({
          current_step: body.current_step,
        }),

        solicitud.id,
      ],
    );
  }

  return true;
};

export const finalizeApplicationService = async ({ solicitud_id, user_id }) => {
  /*
  | VALIDAR SOLICITUD
  */

  const [rows] = await pool.query(
    `
    SELECT
      s.id,
      s.url_Rem,
      s.cliente_id

    FROM solicitud s

    INNER JOIN sis_usuario su
      ON su.cliente_id = s.cliente_id

    WHERE s.id = ?
      AND su.id = ?

    LIMIT 1
    `,
    [solicitud_id, user_id],
  );

  if (!rows.length) {
    console.log("Solicitud no encontrada");

    throw new Error("Solicitud no encontrada");
  }

  const solicitud = rows[0];

  /*
  | SI YA EXISTE URL REM
  */

  if (solicitud.url_Rem) {
    console.log("Solicitud ya tiene URL REM:", solicitud.url_Rem);
    return {
      success: true,

      public_url: solicitud.url_Rem,
    };
  }

  /*
| OBTENER CLIENTE
*/

  const [clienteRows] = await pool.query(
    `
  SELECT
    id,
    nombre,
    apellido_paterno,
    apellido_materno,
    nacimiento_fecha,
    rfc,
    curp,
    telefono_movil,
    id_rem

  FROM cliente

  WHERE id = ?

  LIMIT 1
  `,
    [solicitud.cliente_id],
  );

  if (!clienteRows.length) {
    throw new Error("Cliente no encontrado");
  }

  const cliente = clienteRows[0];

  /*
| SINCRONIZAR PERSONA REM
*/

  const rem = await syncPersonRemService({
    cliente_id: cliente.id,

    nombre: cliente.nombre,

    apellido_paterno: cliente.apellido_paterno,

    apellido_materno: cliente.apellido_materno,

    nacimiento_fecha: cliente.nacimiento_fecha,

    rfc: cliente.rfc,

    curp: cliente.curp,

    id_rem: cliente.id_rem,
  });

  /*
| ACTUALIZAR ID REM
*/

  await pool.query(
    `
  UPDATE cliente
  SET id_rem = ?
  WHERE id = ?
  `,
    [rem.id_rem, cliente.id],
  );

  /*
  | CREAR WORKFLOW
  */

  const workflow = await createWorkflowRemService({
    cliente_id: solicitud.cliente_id,

    solicitud_id,

    people_uuid: rem.id_rem,

    redirect_url: `${process.env.FRONT_URL}/solicitudes/${solicitud_id}/finalizado`,
  });

  /*
| CREAR TOKEN WORKFLOW
*/

  const token = await createWorkflowTokenRemService({
    workflow_uuid: workflow.result.uuid,

    cliente_id: solicitud.cliente_id,

    solicitud_id,

    people_uuid: workflow.result.people_uuid,

    proceso: "FINALIZAR_SOLICITUD",
  });

  /*
| URL REM
*/

  const public_url = token?.result?.public_url || null;

  if (!public_url) {
    console.log("REM no devolvió public_url:", token);

    throw new Error("REM no devolvió public_url");
  }

  /*
  | GUARDAR URL REM
  */

  await pool.query(
    `
    UPDATE solicitud
    SET
      url_Rem = ?,

      num_intentos_firma =
        IFNULL(num_intentos_firma,0) + 1

    WHERE id = ?
    `,
    [public_url, solicitud.id],
  );

  /*
  | RESPONSE
  */

  return {
    success: true,

    id_rem: rem.id_rem,

    workflow_uuid: workflow?.result?.uuid || null,

    webhook_uuid: workflow?.webhook_uuid || null,

    people_uuid: workflow?.result?.people_uuid || null,

    public_url,

    workflow,
  };
};
