// src/utils/phpJson.js
// json_encode() tal como lo hace PHP 5.6 (el sistema actual), para que los JSON que se guardan en
// la base (amortizacion, referencias_json, redes_sociales, bitácoras) queden idénticos:
//  - números con 14 cifras significativas (ini "precision" = 14)
//  - "/" se escribe "\/", y los caracteres no ASCII como \uXXXX (salvo unescapedUnicode)
//  - arreglos vacíos como [] y objetos con llaves 0..n-1 como lista

const hex4 = (n) => "\\u" + n.toString(16).padStart(4, "0");

const encodeString = (s, unescapedUnicode) => {
  let out = '"';
  for (const ch of String(s)) {
    const code = ch.codePointAt(0);
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "/") out += "\\/";
    else if (ch === "\b") out += "\\b";
    else if (ch === "\f") out += "\\f";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (code < 0x20) out += hex4(code);
    else if (code < 0x80 || unescapedUnicode) out += ch;
    else if (code > 0xffff) {
      const v = code - 0x10000;
      out += hex4(0xd800 + (v >> 10)) + hex4(0xdc00 + (v & 0x3ff));
    } else out += hex4(code);
  }
  return out + '"';
};

/** Número como json_encode de PHP 5.6 con precision = 14 (formato %.14G de PHP). */
export const encodeNumber = (n) => {
  if (!Number.isFinite(n)) return "0";
  if (Object.is(n, -0)) return "-0";
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const r = Number(n.toPrecision(14));
  const abs = Math.abs(r);
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e14)) {
    let [mant, exp] = r.toExponential().split("e");
    if (!mant.includes(".")) mant += ".0";
    return `${mant}e${exp.startsWith("-") ? exp : "+" + exp.replace("+", "")}`;
  }
  return String(r);
};

const esLista = (v) => {
  const keys = Object.keys(v);
  return keys.every((k, i) => k === String(i));
};

export const phpJsonEncode = (value, { unescapedUnicode = false } = {}) => {
  const enc = (v) => {
    if (v === null || v === undefined) return "null";
    if (v === true) return "true";
    if (v === false) return "false";
    if (typeof v === "number") return encodeNumber(v);
    if (typeof v === "string") return encodeString(v, unescapedUnicode);
    if (Array.isArray(v) || (typeof v === "object" && esLista(v))) {
      return "[" + Object.values(v).map(enc).join(",") + "]";
    }
    if (typeof v === "object") {
      return "{" + Object.entries(v).map(([k, x]) => encodeString(k, unescapedUnicode) + ":" + enc(x)).join(",") + "}";
    }
    return "null";
  };
  return enc(value);
};

/** Fila de MySQL como la regresa mysqli en PHP: todos los valores como texto (NULL se queda null). */
export const comoMysqli = (row) =>
  row ? Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null || v === undefined ? null : String(v)])) : row;
