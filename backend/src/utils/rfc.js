// CALCULAR RFC
export const calcularRFCUtils = (
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