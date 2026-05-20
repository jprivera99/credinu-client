import { pool } from "../../config/db.js";
import { insertProcessRemLog } from "./processRem.service.js";

/*
| OBTENER CLIENTE
*/

const getClienteById = async (cliente_id) => {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      nombre,
      apellido_paterno,
      apellido_materno,
      telefono_movil,
      nacimiento_fecha,
      rfc,
      curp,
      id_rem

    FROM cliente
    WHERE id = ?
    LIMIT 1
    `,
    [cliente_id],
  );

  return rows[0] || null;
};

/*
| BUSCAR PERSONA POR CURP
*/

export const searchPersonByCurpService = async ({ cliente_id, curp }) => {
  const url = `${process.env.REM_URL}onboarding/people-search/${curp}/national-id`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Rem-Apikey": process.env.REM_APIKEY,
    },
  });

  const data = await response.json();

  await insertProcessRemLog({
    tipo: "CONSULTA_PERSONA_CURP",
    relacion: "Cliente",
    id_relacion: cliente_id,
    id_rem: data?.result?.[0]?.id || null,
    url,
    respuesta: data,
  });

  return data;
};

/*
| CREAR PERSONA
*/

export const createPersonRemService = async ({
  cliente_id,
  nombre,
  apellido_paterno,
  apellido_materno,
  nacimiento_fecha,
  rfc,
  curp,
}) => {
  const url = `${process.env.REM_URL}onboarding/people`;

  const body = {
    national_id: curp,

    name: nombre,

    first_lastname: apellido_paterno,

    second_lastname: apellido_materno,

    birthdate: `${nacimiento_fecha}T00:00:00.000000Z`,

    tax_id: rfc,

    external_ref_id: cliente_id,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Rem-Apikey": process.env.REM_APIKEY,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  const id_rem = data?.id || null;

  if (!id_rem) {
    throw new Error("No fue posible crear persona en REM");
  }

  /*
  | GUARDAR ID REM
  */

  await pool.query(
    `
    UPDATE cliente
    SET id_rem = ?
    WHERE id = ?
    `,
    [id_rem, cliente_id],
  );

  /*
  | LOG
  */

  await insertProcessRemLog({
    tipo: "ALTA_CLIENTE",
    relacion: "Cliente",
    id_relacion: cliente_id,
    id_rem,
    url,
    data: body,
    respuesta: data,
  });

  return id_rem;
};

/*
| SINCRONIZAR PERSONA
*/

export const syncPersonRemService = async ({ cliente_id }) => {
  const cliente = await getClienteById(cliente_id);

  if (!cliente) {
    throw new Error("Cliente no encontrado");
  }

  /*
  | YA EXISTE ID REM
  */

  if (cliente.id_rem) {
    return cliente.id_rem;
  }

  /*
  | BUSCAR POR CURP
  */

  const search = await searchPersonByCurpService({
    cliente_id,
    curp: cliente.curp,
  });

  const remPerson = search?.result?.[0] || null;

  /*
  | EXISTE EN REM
  */

  if (remPerson?.id) {
    await pool.query(
      `
      UPDATE cliente
      SET id_rem = ?
      WHERE id = ?
      `,
      [remPerson.id, cliente_id],
    );

    return remPerson.id;
  }

  /*
  | CREAR PERSONA
  */

  return await createPersonRemService({
    cliente_id,

    nombre: cliente.nombre,

    apellido_paterno: cliente.apellido_paterno,

    apellido_materno: cliente.apellido_materno,

    nacimiento_fecha: cliente.nacimiento_fecha,

    rfc: cliente.rfc,

    curp: cliente.curp,
  });
};

/*
| CREATE WORKFLOW
*/

export const createWorkflowRemService = async ({
  cliente_id,
  solicitud_id,
  redirect_url = "",
}) => {
  /*
    |--------------------------------------------------------------------------
    | OBTENER ID REM
    |--------------------------------------------------------------------------
    */

  const [clienteRows] = await pool.query(
    `
        SELECT
          id_rem

        FROM cliente

        WHERE id = ?

        LIMIT 1
        `,
    [cliente_id],
  );

  if (!clienteRows.length) {
    throw new Error("Cliente no encontrado");
  }

  const cliente = clienteRows[0];

  /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

  const body = {
    people_uuid: cliente.id_rem,

    external_reference_id: `S${solicitud_id}`,

    callback_url: process.env.REM_WEBHOOK_URL,

    autofill: {},

    metadata: {},

    expires_in: 0,

    steps: ["enroll_basic"],
  };

  /*
    |--------------------------------------------------------------------------
    | REQUEST
    |--------------------------------------------------------------------------
    */

  let url = `${process.env.REM_URL}workflows`;

  if (redirect_url) {
    url += `?redirect_url=${encodeURIComponent(redirect_url)}`;
  }

  const res = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      "rem-apikey": process.env.REM_APIKEY,
    },

    body: JSON.stringify(body),
  });

  const data = await res.json();

  console.log("REM WORKFLOW:", data);

  /*
    |--------------------------------------------------------------------------
    | LOG
    |--------------------------------------------------------------------------
    */

  await insertProcessRemLog({
    tipo: "WORKFLOW",

    id_rem: cliente.id_rem,

    relacion: "Solicitud",

    id_relacion: solicitud_id,

    url,

    data: body,

    respuesta: data,

    webhook_uuid: data?.webhook_uuid || null,

    proceso: "VALIDACION_INE",
  });

  return data;
};
