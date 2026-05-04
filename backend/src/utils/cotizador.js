// utils/cotizador.js

import { amortizacionConGracia } from "./amortizacion.js";

export const calcularAdelantoNomina = (producto, data) => {
  const tasaIVA = 0.16;

  const ingreso = Number(data.ingreso);
  let monto = Number(data.monto);

  if (monto > ingreso * 2) {
    monto = ingreso * 2;
  }

  const tasaRenovacion = Number(producto.tasa_renovacion) / 100;

  let pagoRenovacion = monto * tasaRenovacion;
  pagoRenovacion = Math.ceil(pagoRenovacion * (1 + tasaIVA));

  let decenas = pagoRenovacion % 100;
  pagoRenovacion -= decenas;
  pagoRenovacion += decenas < 50 ? 50 : 100;

  const capacidadPago = ingreso * 0.3;

  const pagoMaximo = capacidadPago - pagoRenovacion;

  const numPagos = Math.ceil(monto / pagoMaximo);

  const pago = monto / numPagos;

  const info = {
    monto,
    tasa_iva: tasaIVA,
    duracion: 6,
    periodicidad: producto.periodicidad.toLowerCase(),
    tasa_renovacion: tasaRenovacion,
    pago_gracia: pago,
    num_pagos_gracia: numPagos,
  };

  const amortizacion = amortizacionConGracia(info);

  return {
    producto: "ADELANTO_NOMINA",
    monto,
    pago,
    numPagos,
    amortizacion,
  };
};