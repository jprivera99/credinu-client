// utils/amortizacion/amortizacion.js

export const amortizacionConGracia = (info) => {
  const ivaRate = Number(info.tasa_iva) || 0;
  const capitalInicial = Number(info.monto);
  const tasaRenovacion = Number(info.tasa_renovacion);
  const meses = Number(info.duracion);
  const periodicidad = info.periodicidad;

  let paymentNumber = 0;

  switch (periodicidad) {
    case "semanal":
      paymentNumber = Math.round(meses * (52 / 12));
      break;
    case "catorcenal":
      paymentNumber = Math.round(meses * (26 / 12));
      break;
    case "quincenal":
      paymentNumber = meses * 2;
      break;
    case "mensual":
      paymentNumber = meses;
      break;
  }

  let pagosRenovacion = paymentNumber - Number(info.num_pagos_gracia);

  let capital = capitalInicial;

  const tabla = [];

  for (let i = 1; i <= paymentNumber; i++) {
    const saldoInicial = capital;

    let interes = saldoInicial * tasaRenovacion;
    let iva = interes * ivaRate;

    let amortizacion = 0;

    if (pagosRenovacion <= 0) {
      amortizacion = Number(info.pago_gracia);
      capital -= amortizacion;
    }

    tabla.push({
      periodo: i,
      saldo_inicial: saldoInicial,
      interes,
      iva,
      amortizacion,
      saldo_final: capital,
    });

    if (pagosRenovacion > 0) pagosRenovacion--;
  }

  return tabla;
};