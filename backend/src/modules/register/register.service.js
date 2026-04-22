import { pool } from "../../config/db.js";
import crypto from "crypto";
import { sendToRem, sendSMSRem, validateSMSRem } from "../rem/rem.service.js";

// PRE REGISTER (USANDO TRIGGER)
export const preRegisterService = async (data) => {
  const {
    correo,
    telefono,
    nombre,
    apellido_paterno,
    apellido_materno,
    rfc,
    curp,
    institucion,
    account_id,
    fecha_nacimiento,
    nacimiento_estado,
    nacimiento_entidad_federativa,
    genero,
  } = data;

  // 1. VALIDACIONES BÁSICAS

  if (!correo) throw new Error("Correo requerido");
  if (!telefono) throw new Error("Teléfono requerido");

  // 2. VALIDAR CORREO

  const [correoRows] = await pool.query(
    `SELECT id FROM sis_usuario WHERE usuario = ? LIMIT 1`,
    [correo],
  );

  if (correoRows.length > 0) {
    throw new Error("Correo ya registrado");
  }

  // 3. VALIDAR TELÉFONO

  const [telefonoRows] = await pool.query(
    `SELECT id FROM cliente WHERE telefono_movil = ? LIMIT 1`,
    [telefono],
  );

  if (telefonoRows.length > 0) {
    throw new Error("Teléfono ya registrado");
  }

  // 4. VALIDAR RFC

  const [rfcRows] = await pool.query(
    `SELECT id FROM cliente WHERE rfc = ? LIMIT 1`,
    [rfc],
  );

  if (rfcRows.length > 0) {
    throw new Error("RFC ya registrado");
  }

  // 5. VALIDAR CURP

  const [curpRows] = await pool.query(
    `SELECT id FROM cliente WHERE curp = ? LIMIT 1`,
    [curp],
  );

  if (curpRows.length > 0) {
    throw new Error("CURP ya registrado");
  }

  // 6. GENERAR PASSWORD Y TOKEN

  const passwordTemp = generarPasswordTemporal();
  const token = generarToken();

  // 7. INSERT PRE_REGISTRO (DISPARA TRIGGER)

  const [preResult] = await pool.query(
    `INSERT INTO pre_registro (
            correo,
            telefono,
            nombre,
            apellido_paterno,
            apellido_materno,
            rfc,
            curp,
            institucion,
            account_id,
            nacimiento_fecha,
            nacimiento_estado,
            nacimiento_entidad_federativa,
            genero,
            token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      correo,
      telefono,
      nombre,
      apellido_paterno,
      apellido_materno,
      rfc,
      curp,
      institucion,
      account_id,
      fecha_nacimiento,
      nacimiento_estado,
      nacimiento_entidad_federativa,
      genero,
      token,
    ],
  );

  const preregistroId = preResult.insertId;

  // 8. OBTENER USUARIO GENERADO POR TRIGGER

  const [userRows] = await pool.query(
    `SELECT id, cliente_id 
         FROM sis_usuario 
         WHERE preregistro_id = ? 
         LIMIT 1`,
    [preregistroId],
  );

  if (userRows.length === 0) {
    throw new Error("El trigger no generó el usuario");
  }

  const userId = userRows[0].id;
  const clienteId = userRows[0].cliente_id;

  // 7. ACTUALIZAR CLIENTE

  await pool.query(
    `UPDATE cliente 
         SET telefono_movil = ?, nombre = ?, rfc = ?, curp = ?
         WHERE id = ?`,
    [telefono, nombre, rfc, curp, clienteId],
  );

  // 9. ENVIAR A REM

  await sendToRem(clienteId);

  // 10. ENVIAR CORREO

  enviarCorreo(correo, passwordTemp, token);

  return ok(res, data, "Registro exitoso");
};

// PASSWORD TEMPORAL
const generarPasswordTemporal = () => {
  return Math.random().toString(36).slice(-8);
};

// TOKEN
const generarToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// SIMULACIÓN DE EMAIL
const enviarCorreo = (correo, passwordTemp, token) => {
  console.log(`
    ====== EMAIL ======
    Correo: ${correo}
    Password temporal: ${passwordTemp}
    Link: http://localhost:3000/activar?token=${token}
    ====================
    `);
};

export const validateRegisterService = async ({
  correo,
  telefono,
  rfc,
  curp,
}) => {
  // VALIDAR CORREO
  const [correoRows] = await pool.query(
    `SELECT id FROM sis_usuario WHERE email = ? LIMIT 1`,
    [correo],
  );

  if (correoRows.length > 0) {
    throw new Error("Correo ya registrado");
  }

  // VALIDAR TELÉFONO
  const [telefonoRows] = await pool.query(
    `SELECT id FROM cliente WHERE telefono_movil = ? LIMIT 1`,
    [telefono],
  );

  if (telefonoRows.length > 0) {
    throw new Error("Teléfono ya registrado");
  }

  // VALIDAR RFC (YA EXISTE)
  const [rfcRows] = await pool.query(
    `SELECT id FROM cliente WHERE rfc = ? LIMIT 1`,
    [rfc],
  );

  if (rfcRows.length > 0) {
    throw new Error("RFC ya registrado");
  }

  // VALIDAR CURP (YA EXISTE)
  const [curpRows] = await pool.query(
    `SELECT id FROM cliente WHERE curp = ? LIMIT 1`,
    [curp],
  );

  if (curpRows.length > 0) {
    throw new Error("CURP ya registrado");
  }

  // VALIDAR FORMATO RFC
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (!rfcRegex.test(rfc)) {
    throw new Error("RFC inválido");
  }

  // VALIDAR FORMATO CURP
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
  if (!curpRegex.test(curp)) {
    throw new Error("CURP inválido");
  }

  return {
    valid: true,
  };
};

//---------------------------------------------------------------

// VALIDAR CORREO
export const validateEmailService = async (correo) => {
  const [rows] = await pool.query(
    `SELECT id FROM sis_usuario WHERE email = ? LIMIT 1`,
    [correo],
  );

  return {
    exists: rows.length > 0,
  };
};

// VALIDAR TELÉFONO
export const validatePhoneService = async (telefono) => {
  const [rows] = await pool.query(
    `SELECT id FROM cliente WHERE telefono_movil = ? LIMIT 1`,
    [telefono],
  );

  return {
    exists: rows.length > 0,
  };
};

// VALIDAR SMS (MOCK)
export const validateSMSService = async ({ telefono, codigo }) => {
  if (codigo !== "123456") {
    throw new Error("Código inválido");
  }

  return {
    success: true,
  };
};

// UTIL
const generarPassword = () => {
  return Math.random().toString(36).slice(-8);
};

// ENVIAR CÓDIGO
export const sendCodeService = async ({ telefono, canal }) => {
  if (!telefono) throw new Error("Teléfono requerido");
  if (!canal) throw new Error("Canal requerido");

  if (!["sms", "whatsapp"].includes(canal)) {
    throw new Error("Canal inválido");
  }

  // llamada a REM
  const response = await sendSMSRem({
    telefono,
    canal,
  });

  return response;
};

// VALIDAR CÓDIGO
export const validateCodeService = async ({ telefono, codigo }) => {
  if (!telefono) throw new Error("Teléfono requerido");
  if (!codigo) throw new Error("Código requerido");

  const response = await validateSMSRem({
    telefono,
    codigo,
  });

  if (!response.valid) {
    throw new Error("Código inválido");
  }

  return {
    valid: true,
  };
};

// ---------------CALCULAR RFC-------------------
export const calcularRFCService = (
  nombre,
  apellido_paterno,
  apellido_materno,
  fecha_nacimiento,
) => {
  const clean = (str) =>
    str
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/Ñ/g, "X")
      .replace(/[^A-Z]/g, "");

  const cleanForHomoclave = (str) =>
    str
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-ZÑ& ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const nombreCompletoHomoclave = [
    cleanForHomoclave(apellido_paterno),
    cleanForHomoclave(apellido_materno),
    cleanForHomoclave(nombre),
  ]
    .filter(Boolean)
    .join(" ");

  nombre = clean(nombre);
  apellido_paterno = clean(apellido_paterno);
  apellido_materno = clean(apellido_materno);

  let rfc = apellido_paterno[0] || "X";

  const vocal = apellido_paterno.slice(1).match(/[AEIOU]/);
  rfc += vocal ? vocal[0] : "X";

  rfc += apellido_materno[0] || "X";
  rfc += nombre[0] || "X";

  const [year, month, day] = fecha_nacimiento.split("-");
  const rfcBase = rfc + year.slice(2) + month + day;

  const homoclave = generarHomoclaveRFC(nombreCompletoHomoclave);

  const rfc12 = rfcBase + homoclave;
  const digitoVerificador = generarDigitoVerificadorRFC(rfc12);

  return rfc12 + digitoVerificador;
};

const generarHomoclaveRFC = (nombreCompleto) => {
  const valores = {
    " ": "00",
    "&": "10",
    A: "11",
    B: "12",
    C: "13",
    D: "14",
    E: "15",
    F: "16",
    G: "17",
    H: "18",
    I: "19",
    J: "21",
    K: "22",
    L: "23",
    M: "24",
    N: "25",
    O: "26",
    P: "27",
    Q: "28",
    R: "29",
    S: "32",
    T: "33",
    U: "34",
    V: "35",
    W: "36",
    X: "37",
    Y: "38",
    Z: "39",
    Ñ: "40",
  };

  const chars = ` ${nombreCompleto}`;
  let cadenaNumerica = "";

  for (const char of chars) {
    cadenaNumerica += valores[char] || "00";
  }

  let suma = 0;
  for (let i = 0; i < cadenaNumerica.length - 1; i++) {
    const a = Number(cadenaNumerica.substring(i, i + 2));
    const b = Number(cadenaNumerica.substring(i + 1, i + 2));
    suma += a * b;
  }

  const ultimosTres = suma % 1000;
  const cociente = Math.floor(ultimosTres / 34);
  const residuo = ultimosTres % 34;
  const tabla = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";

  return `${tabla[cociente]}${tabla[residuo]}`;
};

const generarDigitoVerificadorRFC = (rfc12) => {
  const valores = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    G: 16,
    H: 17,
    I: 18,
    J: 19,
    K: 20,
    L: 21,
    M: 22,
    N: 23,
    "&": 24,
    O: 25,
    P: 26,
    Q: 27,
    R: 28,
    S: 29,
    T: 30,
    U: 31,
    V: 32,
    W: 33,
    X: 34,
    Y: 35,
    Z: 36,
    " ": 37,
    Ñ: 38,
  };

  let suma = 0;

  for (let i = 0; i < rfc12.length; i++) {
    const valor = valores[rfc12[i]];
    suma += valor * (13 - i);
  }

  const residuo = suma % 11;

  if (residuo === 0) return "0";
  if (residuo === 1) return "A";

  return String(11 - residuo);
};

// ---------------CALCULAR CURP-------------------

// UTILIDADES
const limpiar = (str = "") =>
  str
    .toUpperCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ñ/g, "X")
    .replace(/[^A-Z\s]/g, "");

const palabrasProhibidas = [
  "BACA",
  "LOCO",
  "BUEI",
  "BUEY",
  "MAME",
  "CACA",
  "MAMO",
  "CACO",
  "MEAR",
  "CAGA",
  "MEAS",
  "CAGO",
  "MEON",
  "CAKA",
  "MIAR",
  "CAKO",
  "MION",
  "COGE",
  "MOCO",
  "COGI",
  "MOKO",
  "COJA",
  "MULA",
  "COJE",
  "MULO",
  "COJI",
  "NACA",
  "COJO",
  "NACO",
  "COLA",
  "PEDA",
  "CULO",
  "PEDO",
  "FALO",
  "PENE",
  "FETO",
  "PIPI",
  "GETA",
  "PITO",
  "GUEI",
  "POPO",
  "GUEY",
  "PUTA",
  "JETA",
  "PUTO",
  "JOTO",
  "QULO",
  "KACA",
  "RATA",
  "KACO",
  "ROBA",
  "KAGA",
  "ROBE",
  "KAGO",
  "ROBO",
  "KAKA",
  "RUIN",
  "KAKO",
  "SENO",
  "KOGE",
  "TETA",
  "KOGI",
  "VACA",
  "KOJA",
  "VAGA",
  "KOJE",
  "VAGO",
  "KOJI",
  "VAKA",
  "KOJO",
  "VUEI",
  "KOLA",
  "VUEY",
  "KULO",
  "WUEI",
  "LILO",
  "WUEY",
  "LOCA",
];

const filtrarPalabra = (str) => {
  return palabrasProhibidas.includes(str)
    ? str.substring(0, 1) + "X" + str.substring(2)
    : str;
};

const vocalInterna = (str) => {
  const match = str.slice(1).match(/[AEIOU]/);
  return match ? match[0] : "X";
};

const consonanteInterna = (str) => {
  const match = str.slice(1).match(/[^AEIOU]/);
  return match ? match[0].replace("Ñ", "X") : "X";
};

// ESTADOS (RENAPO)
const estados = {
  AGS: "AS",
  BC: "BC",
  BCS: "BS",
  CAM: "CC",
  CHIS: "CS",
  CHIH: "CH",
  CDMX: "DF",
  COAH: "CL",
  COL: "CM",
  DGO: "DG",
  GTO: "GT",
  GRO: "GR",
  HGO: "HG",
  JAL: "JC",
  MEX: "MC",
  MICH: "MN",
  MOR: "MS",
  NAY: "NT",
  NL: "NL",
  OAX: "OC",
  PUE: "PL",
  QRO: "QT",
  QROO: "QR",
  SLP: "SP",
  SIN: "SL",
  SON: "SR",
  TAB: "TC",
  TAMS: "TS",
  TLAX: "TL",
  VER: "VZ",
  YUC: "YN",
  ZAC: "ZS",
  EXT: "NE",
};

// NOMBRES COMUNES A OMITIR
const nombresIgnorar = [
  "JOSE",
  "MARIA",
  "MA",
  "MA.",
  "DE",
  "LA",
  "LAS",
  "LOS",
  "Y",
  "VON",
  "VAN",
  "DEL",
  "MC",
  "MAC",
];

const limpiarNombre = (nombre) => {
  const partes = nombre.split(" ");
  if (partes.length > 1 && nombresIgnorar.includes(partes[0])) {
    return partes.slice(1).join(" ");
  }
  return nombre;
};

// DIGITO VERIFICADOR
const calcularDigitoVerificador = (curp17) => {
  const chars = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

  let suma = 0;

  for (let i = 0; i < 17; i++) {
    const valor = chars.indexOf(curp17[i]);
    suma += valor * (18 - i);
  }

  let digito = 10 - (suma % 10);
  if (digito === 10) digito = 0;

  return digito.toString();
};

// FUNCIÓN PRINCIPAL
export const calcularCURPService = (
  nombre,
  apPaterno,
  apMaterno,
  fechaNacimiento,
  sexo,
  estado,
) => {
  nombre = limpiar(nombre);
  apPaterno = limpiar(apPaterno);
  apMaterno = limpiar(apMaterno);

  nombre = limpiarNombre(nombre);

  const nombreBase = nombre.split(" ")[0];

  // 1. Iniciales
  let curp =
    (apPaterno[0] || "X") +
    vocalInterna(apPaterno) +
    (apMaterno[0] || "X") +
    (nombreBase[0] || "X");

  curp = filtrarPalabra(curp);

  // 2. Fecha (YYYY-MM-DD → YYMMDD)
  const [y, m, d] = fechaNacimiento.split("-");
  curp += y.slice(2) + m + d;

  // 3. Sexo
  curp += sexo.toUpperCase();

  // 4. Estado
  curp += estados[estado] || "NE";

  // 5. Consonantes internas
  curp += consonanteInterna(apPaterno);
  curp += consonanteInterna(apMaterno);
  curp += consonanteInterna(nombreBase);

  // 6. Homoclave básica (año)
  const anio = parseInt(y);
  curp += anio < 2000 ? "0" : "A";

  // 7. Dígito verificador
  const digito = calcularDigitoVerificador(curp);
  curp += digito;

  return curp;
};
