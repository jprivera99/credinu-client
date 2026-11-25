// src/utils/cotizador/php.js
// Equivalencias de funciones y comportamientos de PHP 5.6 / MySQL que usa el cotizador del
// sistema actual, para que los cálculos den exactamente lo mismo.

/** Número como lo convierte PHP ("12.5" -> 12.5, null/"" -> 0, "2-" -> 2). */
export const num = (v) => {
  if (v === null || v === undefined || v === false || v === "") return 0;
  if (v === true) return 1;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const m = String(v).trim().match(/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
  return m ? Number(m[0]) : 0;
};

/** (int) de PHP */
export const int = (v) => Math.trunc(num(v));

/** isset() de PHP */
export const isset = (v) => v !== undefined && v !== null;

/** Verdadero/falso como PHP ("0", "", 0, null -> false) */
export const truthy = (v) => !(v === undefined || v === null || v === false || v === 0 || v === "" || v === "0");

/** round() de PHP (redondeo "half up" con pre-redondeo a 15 dígitos). */
export const round = (value, precision = 0) => {
  const v = num(value);
  const f = 10 ** precision;
  const tmp = Number((v * f).toPrecision(15));
  const r = tmp >= 0 ? Math.floor(tmp + 0.5) : Math.ceil(tmp - 0.5);
  return Number((r / f).toPrecision(15));
};

/** División de PHP 5.6: entre cero regresa false (que vale 0 en operaciones). */
export const div = (a, b) => (num(b) === 0 ? 0 : num(a) / num(b));

/** number_format($n, $dec) */
export const numberFormat = (n, dec = 0) => {
  const r = round(n, dec);
  const [ent, frac] = Math.abs(r).toFixed(dec).split(".");
  const conComas = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (r < 0 ? "-" : "") + conComas + (dec > 0 ? "." + frac : "");
};

/** sprintf('%.2F', $v) */
export const fixed2 = (v) => round(v, 2).toFixed(2);

/* ------------------------------ Fechas ------------------------------ */

const pad = (n) => String(n).padStart(2, "0");
const diasMes = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const parse = (s) => {
  const [y, m, d] = String(s).split("-").map((x) => parseInt(x, 10));
  return { y, m, d };
};
const fmt = (dt) => `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;

/** Fecha de hoy en la zona del servidor del sistema actual (America/Monterrey). */
export const hoy = () => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Monterrey", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), str: `${p.year}-${p.month}-${p.day}` };
};

/** MySQL DATE_ADD(fecha, INTERVAL n DAY) */
export const addDays = (date, n) => {
  const { y, m, d } = parse(date);
  return fmt(new Date(Date.UTC(y, m - 1, d + num(n))));
};

/** MySQL DATE_ADD(fecha, INTERVAL n MONTH) (ajusta al último día si no existe) */
export const addMonths = (date, n) => {
  const { y, m, d } = parse(date);
  const total = y * 12 + (m - 1) + int(n);
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${pad(nm)}-${pad(Math.min(d, diasMes(ny, nm)))}`;
};

export const addWeeks = (date, n) => addDays(date, int(n) * 7);

/** ultimo_dia($anio, $mes) de app_helper.php */
export const ultimoDia = (anio, mes) => {
  const bis = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
  return [31, bis ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1];
};

/** Tabla_amortizacion::getLastDayOfMonth (incluye sus casos especiales). */
export const getLastDayOfMonth = (date) => {
  const { d } = parse(date);
  let r = addDays(addMonths(date, 1), -d);
  const [year, month] = r.split("-");
  if (Number(month) === 1) r = `${year}-${month}-31`;
  if (Number(month) === 2 && Number(year) % 4 === 0) r = `${year}-${month}-29`;
  return r;
};

/** Tabla_amortizacion::payDay */
export const payDay = (dateStart, payNumber, period) => {
  const s = String(dateStart);
  switch (Number(period)) {
    case 110:
      return addWeeks(s, payNumber);
    case 111: {
      // PHP 5.6: (int)"2-" == 2 -> fechas de febrero o diciembre (MM = x2) con día 15.
      const especial = parseInt(s.substr(6, 2), 10) === 2 && parseInt(s.substr(8, 2), 10) === 15;
      let ret = addDays(s, payNumber * (especial ? 12 : 15));
      if (payNumber > 0) {
        ret = Number(ret.substr(8, 2)) > 15 ? getLastDayOfMonth(ret) : ret.substr(0, 8) + "15";
      }
      return ret;
    }
    case 112:
      return addMonths(s, payNumber);
    case 118:
      return addDays(s, payNumber * 14);
    case 1157:
      return addDays(s, payNumber * 10);
    default:
      return null;
  }
};

/** Primer fecha de pago: día 15 o último día del mes actual. */
export const fechaInicioCotizador = () => {
  const t = hoy();
  return t.d <= 15 ? `${t.y}-${pad(t.m)}-15` : `${t.y}-${t.m}-${ultimoDia(t.y, t.m)}`;
};

/* ------------------------------ pow() ------------------------------ */

// pow() de PHP usa la del sistema (glibc), que da el resultado correctamente redondeado.
// Math.pow de JavaScript puede desviarse en el último bit, lo que cambia la cifra 14 del JSON.
// Para exponentes enteros se calcula en doble-doble (≈32 dígitos) y se redondea al final.
const SPLIT = 134217729; // 2^27 + 1
const twoProd = (a, b) => {
  const p = a * b;
  let t = SPLIT * a;
  const ah = t - (t - a), al = a - ah;
  t = SPLIT * b;
  const bh = t - (t - b), bl = b - bh;
  return [p, ((ah * bh - p) + ah * bl + al * bh) + al * bl];
};
const ddMul = ([ah, al], [bh, bl]) => {
  let [p, e] = twoProd(ah, bh);
  e += ah * bl + al * bh;
  const s = p + e;
  return [s, e - (s - p)];
};
export const pow = (base, exp) => {
  const x = num(base);
  const n = num(exp);
  if (!Number.isInteger(n) || Math.abs(n) > 1e6 || !Number.isFinite(x) || x === 0) return Math.pow(x, n);
  let result = [1, 0];
  let b = [x, 0];
  let k = Math.abs(n);
  while (k > 0) {
    if (k & 1) result = ddMul(result, b);
    b = ddMul(b, b);
    k = Math.floor(k / 2);
  }
  if (n >= 0) return result[0] + result[1];
  // 1 / (hi + lo) en doble-doble
  const q1 = 1 / result[0];
  const [p, e] = twoProd(q1, result[0]);
  const r = (1 - p - e - q1 * result[1]) / result[0];
  return q1 + r;
};

/* --------------------------- Formulas_excel --------------------------- */

const fvifa = (rate, nper) => (num(rate) === 0 ? num(nper) : (pow(1 + num(rate), num(nper)) - 1) / num(rate));

/** Formulas_excel::PV */
export const PV = (rate, nper, pmt, fv = 0, type = 0) => {
  const pvif = pow(1 + num(rate), num(nper));
  const fa = fvifa(rate, nper);
  if (pvif === 0) return null;
  const pv = (-fv - num(pmt) * (1 + num(rate) * type) * fa) / pvif;
  return Number.isFinite(pv) ? pv : null;
};

/** Formulas_excel::PMT */
export const PMT = (rate, nper, pv, fv = 0, type = 0) => {
  const pvif = pow(1 + num(rate), num(nper));
  const den = (1 + num(rate) * type) * fvifa(rate, nper);
  if (den === 0) return 0;
  const pmt = (-num(pv) * pvif - fv) / den;
  return Number.isFinite(pmt) ? pmt : null;
};
