
// CALCULAR CURP
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
export const calcularCURPUtils = (
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
