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
