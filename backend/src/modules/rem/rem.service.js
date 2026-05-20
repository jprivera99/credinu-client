//src/modules/rem/rem.service.js
import { insertProcessRemLog } from "./processRem.service.js";

//ENPOINT REALES
export const sendCodeService = async ({
  canal,
  phone,
  nombre_cliente,
  retry = false,
}) => {
  const id_cliente = phone;

  if (canal === "SMS") {
    return await sendCodeSMS(id_cliente, phone, nombre_cliente, retry);
  } else {
    return await sendCodeWhatsapp(id_cliente, phone);
  }
};

const sendCodeSMS = async (id_cliente, phone, nombre_cliente, retry) => {
  const url = `${process.env.REM_URL}otp/create/sms`;

  const body = {
    user: id_cliente,
    expires_in: "10m",
    phone: phone,
    country_code_included: false,
    country_code: 52,
    retry: retry,
    metadata: {
      user_name: nombre_cliente,
      company: "CREDINU",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Rem-Apikey": process.env.REM_APIKEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  console.log("REM SMS:", data);

  return data;
};

const sendCodeWhatsapp = async (id_cliente, phone) => {
  const url = `${process.env.REM_URL}otp/create/whatsapp`;

  const body = {
    user: id_cliente,
    expires_in: "10m",
    phone: `52${phone}`,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Rem-Apikey": process.env.REM_APIKEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  console.log("REM WHATSAPP:", data);

  return data;
};

// Función para verificar el código OTP
export const validateCodeService = async ({ phone, code, canal = "SMS" }) => {
  const url = `${process.env.REM_URL}otp/validate`;

  const body = {
    user: phone,
    code: code,
    type: canal, // "SMS" o "WHATSAPP"
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "rem-apikey": process.env.REM_APIKEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  console.log("REM VALIDATE:", data);

  return data;
};

// Función para actualizar o crear persona en REM
export const updatePersonRem = async ({
  id,
  telefono_movil,
  nombre,
  apellido_paterno,
  apellido_materno,
  nacimiento_fecha,
  rfc,
  curp,
}) => {
  const url = `${process.env.REM_URL}person/update`;

  const body = {
    id: id,
    telefono_movil,
    nombre,
    apellido_paterno,
    apellido_materno,
    nacimiento_fecha,
    rfc,
    curp,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "rem-apikey": process.env.REM_APIKEY,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    console.log("REM UPDATE PERSON:", data);

    await insertProcessRemLog({
      tipo: "ACTUALIZACION_CLIENTE",
      id_relacion: id,
      url,
      data: body,
      respuesta: data,
    });
    return true;
  } catch (error) {
    console.error("Error actualizando en REM:", error);
    throw error;
  }
};

export const syncPersonRemService = async ({
  cliente_id,
  nombre,
  apellido_paterno,
  apellido_materno,
  nacimiento_fecha,
  rfc,
  curp,
  id_rem,
}) => {
  /*
    | BUSCAR EN REM
    */

  const search = await searchPersonRemByCurp(curp);

  /*
    | EXISTE
    */

  let existingPerson = null;

  if (
    console.log("Search result:", search),
    search?.result &&
    Array.isArray(search.result) &&
    search.result.length > 0
  ) {
    existingPerson = search.result[0];
    console.log("Persona encontrada en REM:", existingPerson);
  }

  /*
    | FECHA
    */

  let birthdate = null;

  if (nacimiento_fecha) {
    birthdate = new Date(nacimiento_fecha).toISOString();
  }

  /*
    | BODY
    */

  const body = {
    national_id: curp,

    name: nombre,

    first_lastname: apellido_paterno,

    second_lastname: apellido_materno,

    birthdate,

    tax_id: rfc,

    external_ref_id: cliente_id,
  };

  /*
    | UPDATE
    */

  if (existingPerson) {

    console.log("Actualizando persona en REM con ID:", existingPerson.id || existingPerson.uuid);
    
    const remId = existingPerson.id || existingPerson.uuid;

    const url = `${process.env.REM_URL}onboarding/people/${remId}`;

    const res = await fetch(url, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",

        "Rem-Apikey": process.env.REM_APIKEY,
      },

      body: JSON.stringify(body),
    });

    const data = await res.json();

    /*
      | LOG
      */

    await insertProcessRemLog({
      tipo: "ACTUALIZACION_CLIENTE",

      id_rem: remId,

      relacion: "Cliente",

      id_relacion: cliente_id,

      url,

      data: body,

      respuesta: data,
    });

    console.log("Response from REM update:", data);
    
    return {
      id_rem: remId,

      exists: true,

      response: data,
    };
  }

  /*
    | CREATE
    */

  const url = `${process.env.REM_URL}onboarding/people`;

  const res = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      "Rem-Apikey": process.env.REM_APIKEY,
    },

    body: JSON.stringify(body),
  });

  const data = await res.json();

  const remId = data?.id || data?.people_uuid;

  /*
    | LOG
    */

  await insertProcessRemLog({
    tipo: "ALTA_CLIENTE",

    id_rem: remId,

    relacion: "Cliente",

    id_relacion: cliente_id,

    url,

    data: body,

    respuesta: data,
  });

  if (!remId) {
    throw new Error("No fue posible crear persona REM");
  }

  return {
    id_rem: remId,

    exists: false,

    response: data,
  };
};

/*
| BUSCAR PERSONA REM
*/

export const searchPersonRemByCurp = async (curp) => {
  console.log("Buscando persona en REM por CURP:", curp);
  const url = `${process.env.REM_URL}onboarding/people/search?national_id=${curp}`;

  const res = await fetch(url, {
    method: "GET",

    headers: {
      "Content-Type": "application/json",

      "Rem-Apikey": process.env.REM_APIKEY,
    },
  });

  const data = await res.json();

  console.log("REM SEARCH PERSON:", data);

  return data;
};

export const createWorkflowTokenRemService = async ({
  workflow_uuid,
  redirect_url = "",
  cliente_id = null,
  people_uuid = "",
  solicitud_id = null,
  proceso = "",
}) => {
  try {
    /*
    | URL
    */

    let url = `${process.env.REM_URL}workflows/${workflow_uuid}/create-token`;

    if (redirect_url) {
      url += `?redirect_url=${encodeURIComponent(redirect_url)}`;
    }

    /*
    | REQUEST
    */

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "rem-apikey": process.env.REM_APIKEY,
      },
    });

    const data = await res.json();

    console.log("REM CREATE TOKEN:", data);

    /*
    | LOG
    */

    await insertProcessRemLog({
      tipo: "URL_TOKEN_WORKFLOW",

      relacion: solicitud_id ? "Solicitud" : "Cliente",

      id_relacion: solicitud_id || cliente_id,

      id_rem: people_uuid,

      webhook_uuid: workflow_uuid,

      proceso,

      url,

      respuesta: data,
    });

    /*
    | RESPONSE
    */

    return data;
  } catch (error) {
    console.error("ERROR CREATE TOKEN REM:", error);

    throw error;
  }
};