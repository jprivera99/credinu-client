export const sendToRem = async (clienteId) => {
  try {
    console.log(`Enviando cliente ${clienteId} a REM...`);
    return true;
  } catch (error) {
    console.error("Error enviando a REM:", error);
    throw new Error("Error en REM");
  }
};

export const sendSMSRem = async ({ telefono, canal }) => {
  console.log(`Enviando código vía ${canal} a ${telefono}`);

  return {
    success: true,
  };
};

export const validateSMSRem = async ({ telefono, codigo }) => {
  console.log(`Validando código ${codigo} para ${telefono}`);

  if (codigo === "123456") {
    return { valid: true };
  }

  return { valid: false };
};


export const sendCodeService = async ({
  canal,
  phone,
  nombre_cliente,
  retry = false,
}) => {
  const id_cliente = phone;

  if (canal === "SMS") {
    return await sendCodeSMS(
      id_cliente,
      phone,
      nombre_cliente,
      retry
    );
  } else {
    return await sendCodeWhatsapp(id_cliente, phone);
  }
};

const sendCodeSMS = async (
  id_cliente,
  phone,
  nombre_cliente,
  retry
) => {
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
      Authorization: `Bearer ${process.env.REM_APIKEY}`,
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
      Authorization: `Bearer ${process.env.REM_APIKEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  console.log("REM WHATSAPP:", data);

  return data;
};