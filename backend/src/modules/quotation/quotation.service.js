import { pool } from "../../config/db.js";

// CONFIG
const TASAS = {
  12: 2.5,
  18: 2.5,
  24: 2.5,
  30: 2.6,
  36: 2.65,
  42: 2.75,
  48: 2.85,
};

const FACTOR_SEMANAL = 4.33;

// CÁLCULOS BASE (igual PHP)

const pagoTotal = ({ monto, plazo, tasa, gastoAdmin = 0 }) => {
  const capital = monto / plazo;
  const interes = monto * (tasa / 100);
  const pagoMensual = capital + interes;
  return pagoMensual + gastoAdmin;
};

const pagoSemanal = (info) => {
  return pagoTotal(info) / FACTOR_SEMANAL;
};

// TIR (IRR) - equivalente Excel
const calcularTIR = (flujos, guess = 0.1) => {
  let x0 = guess;
  let x1;

  for (let i = 0; i < 100; i++) {
    let f = 0;
    let df = 0;

    for (let t = 0; t < flujos.length; t++) {
      f += flujos[t] / Math.pow(1 + x0, t);
      df += (-t * flujos[t]) / Math.pow(1 + x0, t + 1);
    }

    x1 = x0 - f / df;

    if (Math.abs(x1 - x0) < 1e-7) return x1;

    x0 = x1;
  }

  return x0;
};

// SERVICE PRINCIPAL
export const cotizarService = async ({
  monto,
  ingreso,
  producto_id,
  institucion_id,
}) => {
  // 1. Obtener productos
  const [productos] = await pool.query(
    `
    SELECT ip.*, p.nombre
    FROM institucion_producto ip
    JOIN producto p ON p.id = ip.producto_id
    WHERE ip.institucion_id = ?
    AND IFNULL(ip.borrado,0)=0
    AND IFNULL(ip.ocultar_cliente,0)=0
  `,
    [institucion_id],
  );

  if (!productos.length) return [];

  let productosFiltrados = productos;

  if (producto_id) {
    productosFiltrados = productos.filter((p) => p.producto_id == producto_id);
  }

  const resultados = [];

  for (const prod of productosFiltrados) {
    const montoMax = Number(prod.monto_max);
    const montoMin = Number(prod.monto_min);

    if (monto < montoMin || monto > montoMax) continue;

    const plazo = Number(prod.plazo_max || 12);
    const tasa = TASAS[plazo] || Number(prod.tasa || 2.5);
    const gastoAdmin = Number(prod.gasto_admin || 0);

    // PAGOS

    const pago_total = pagoTotal({
      monto,
      plazo,
      tasa,
      gastoAdmin,
    });

    const pago_semanal = pagoSemanal({
      monto,
      plazo,
      tasa,
      gastoAdmin,
    });

    // AHORRO (igual PHP)

    const precioGasolina = Number(prod.precio_gasolina || 24);
    const precioGas = Number(prod.precio_gas || 12);

    const diasDescanso = Number(prod.dias_descanso || 1);
    const diasVacaciones = Number(prod.dias_vacaciones || 6);
    const diasEnfermedad = Number(prod.dias_enfermedad || 3);
    const consumoDiario = Number(prod.consumo_diario || 10);

    const diasTrabajoMensual =
      30 -
      (diasDescanso * 4 +
        (diasVacaciones / 360) * 30 +
        (diasEnfermedad / 360) * 30);

    const consumoMensual = consumoDiario * diasTrabajoMensual;

    const ahorro = precioGasolina * consumoMensual - consumoMensual * precioGas;

    // PAGO ADICIONAL

    let pago_adicional = 0;

    if (pago_total > ahorro) {
      pago_adicional = Number((pago_total - ahorro).toFixed(2));
    }

    const amdcc = ahorro - pago_total;

    // TIR (igual PHP)

    const pagoMensualFlujo = pago_total - gastoAdmin;

    const flujos = [-monto];

    for (let i = 1; i <= plazo; i++) {
      flujos.push(pagoMensualFlujo);
    }

    const tir = calcularTIR(flujos);
    const tasa_anual = Number((tir * 100 * 12).toFixed(2));

    // RESULTADO FINAL

    resultados.push({
      producto_id: prod.producto_id,
      nombre: prod.nombre,

      monto_aprobado: monto,
      plazo,

      pago_periodico: Number(pago_semanal.toFixed(2)), // ✅ AQUÍ

      tasa,
      pago_total: Number(pago_total.toFixed(2)),
      ahorro: Number(ahorro.toFixed(2)),
      pago_adicional,
      amdcc: Number(amdcc.toFixed(2)),
      tir_mensual: Number((tir * 100).toFixed(4)),
      tasa_anual,
    });
  }

  return resultados;
};

// DETALLE
export const detalleService = async ({
  monto,
  plazo,
  producto_id,
  institucion_id,
}) => {
  // 1. Obtener producto
  const [[producto]] = await pool.query(
    `
    SELECT ip.*, p.nombre
    FROM institucion_producto ip
    JOIN producto p ON p.id = ip.producto_id
    WHERE ip.producto_id = ?
    AND ip.institucion_id = ?
    LIMIT 1
  `,
    [producto_id, institucion_id],
  );

  if (!producto) return null;

  // 2. Obtener tasa (igual lógica que usabas)
  let tasa = 0;

  try {
    if (producto.prod_simulador?.tasas_periodos) {
      const tasas = JSON.parse(producto.prod_simulador.tasas_periodos);
      tasa = Number(tasas?.tasa?.quincenal || 0) / 100;
    }
  } catch {}

  if (!tasa) tasa = 0.025; // fallback

  // 3. Calcular pago fijo
  const pagoFijo = (monto * tasa) / (1 - Math.pow(1 + tasa, -plazo));

  // 4. Tabla amortización
  let saldo = monto;
  const tabla = [];

  for (let i = 1; i <= plazo; i++) {
    const interes = saldo * tasa;
    const capital = pagoFijo - interes;
    const saldoFinal = saldo - capital;

    tabla.push({
      periodo: i,
      saldo_inicial: Number(saldo.toFixed(2)),
      interes: Number(interes.toFixed(2)),
      capital: Number(capital.toFixed(2)),
      pago: Number(pagoFijo.toFixed(2)),
      saldo_final: Number(saldoFinal.toFixed(2)),
    });

    saldo = saldoFinal;
  }

  return {
    producto: producto.nombre,
    monto,
    plazo,
    tasa: Number((tasa * 100).toFixed(4)),
    pago: Number(pagoFijo.toFixed(2)),
    tabla,
  };
};
