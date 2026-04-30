import { json } from "express";
import { pool } from "../../config/db.js";

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

// ================== CALCULOS ==================

const pagoTotal = ({ monto, plazo, tasa, gastoAdmin = 0 }) => {
  const capital = monto / plazo;
  const interes = monto * (tasa / 100);
  return capital + interes + gastoAdmin;
};

const pagoSemanal = (info) => {
  return pagoTotal(info) / FACTOR_SEMANAL;
};

// ===== TIR (igual PHP) =====
const calcularTIR = (flujos, guess = 0.1) => {
  let x0 = guess;

  for (let i = 0; i < 100; i++) {
    let f = 0;
    let df = 0;

    for (let t = 0; t < flujos.length; t++) {
      f += flujos[t] / Math.pow(1 + x0, t);
      df += (-t * flujos[t]) / Math.pow(1 + x0, t + 1);
    }

    const x1 = x0 - f / df;

    if (Math.abs(x1 - x0) < 1e-7) return x1;
    x0 = x1;
  }

  return x0;
};

// ================== COTIZAR ==================

export const cotizarService = async ({
  monto,
  ingreso,
  producto_id,
  institucion_id,
}) => {
  const [productos] = await pool.query(
    `
    SELECT ip.*, p.nombre
    FROM institucion_producto ip
    JOIN producto p ON p.id = ip.producto_id
    WHERE ip.institucion_id = ?
    AND IFNULL(ip.borrado,0)=0
    AND IFNULL(ip.ocultar_cliente,0)=0
  `,
    [institucion_id]
  );

  let filtrados = productos;

  if (producto_id) {
    filtrados = productos.filter((p) => p.producto_id == producto_id);
  }

  const resultados = [];

  for (const prod of filtrados) {
    const montoMin = Number(prod.monto_min);
    const montoMax = Number(prod.monto_max);

    if (monto < montoMin || monto > montoMax) continue;

    const plazo = Number(prod.plazo_max || 12);
    const tasa = TASAS[plazo] || 2.5;
    const gastoAdmin = Number(prod.gasto_admin || 0);

    const pago_total = pagoTotal({ monto, plazo, tasa, gastoAdmin });
    const pago_semanal = pagoSemanal({ monto, plazo, tasa, gastoAdmin });

    // ===== AHORRO =====
    const ahorro = 5000; // simplificado (puedes conectar igual que PHP)

    // ===== TIR =====
    const flujo = [-monto];
    for (let i = 1; i <= plazo; i++) {
      flujo.push(pago_total - gastoAdmin);
    }

    const tir = calcularTIR(flujo);
    const tasa_anual = Number(((tir * 100) * 12).toFixed(2));

    resultados.push({
      producto_id: prod.producto_id,
      nombre: prod.nombre,

      monto_aprobado: monto,
      plazo,

      // IMPORTANTE
      pago_periodico: Number(pago_semanal.toFixed(2)),

      pago_total: Number(pago_total.toFixed(2)),
      tasa,
      ahorro,
      tasa_anual,
    });
  }

  console.log();
  return resultados;
};

// ================== DETALLE ==================

export const detalleService = async ({
  monto,
  plazo,
  producto_id,
  institucion_id,
}) => {
  const [[producto]] = await pool.query(
    `
    SELECT ip.*, p.nombre
    FROM institucion_producto ip
    JOIN producto p ON p.id = ip.producto_id
    WHERE ip.producto_id = ?
    AND ip.institucion_id = ?
    LIMIT 1
  `,
    [producto_id, institucion_id]
  );

  if (!producto) return null;

  const tasa = 0.025;

  const pago =
    (monto * tasa) / (1 - Math.pow(1 + tasa, -plazo));

  let saldo = monto;
  const tabla = [];

  for (let i = 1; i <= plazo; i++) {
    const interes = saldo * tasa;
    const capital = pago - interes;
    const saldoFinal = saldo - capital;

    tabla.push({
      periodo: i,
      saldo_inicial: saldo,
      interes,
      capital,
      pago,
      saldo_final: saldoFinal,
    });

    saldo = saldoFinal;
  }

  return {
    producto: producto.nombre,
    monto,
    plazo,
    tasa: tasa * 100,
    pago,
    tabla,
  };
};