// src/utils/cotizador/tablaAmortizacion.js
// Traducción de application/libraries/Tabla_amortizacion.php (get_amortizacion y
// amortizacion_con_gracia). Se conservan las mismas fórmulas y particularidades para que la
// tabla guardada en solicitud.amortizacion sea igual a la que generaba el sistema actual.

import { num, int, truthy, round, div, pow, payDay, fechaInicioCotizador } from "./php.js";

const CODIGO_PERIODO = { semanal: 110, decenal: 1157, catorcenal: 118, quincenal: 111, mensual: 112 };

/** Tabla_amortizacion::tasa_por_periodo */
export const tasaPorPeriodo = (tasaAnual = 0, periodo = "") => {
  const t = num(tasaAnual);
  switch (periodo) {
    case "mensual":
    case 112:
      return t / 12;
    case "quincenal":
    case 111:
      return t / 24;
    case "semanal":
    case 110:
      return t / 52;
    case "catorcenal":
    case 118:
      return t / 26;
    case "decenal":
    case 1157:
      return t / 36;
    default:
      return 0;
  }
};

const numeroDePagos = (meses, periodo) => {
  switch (periodo) {
    case "semanal":
      return round(meses * (52 / 12));
    case "decenal":
      return round(meses * (36 / 12));
    case "catorcenal":
      return round(meses * (26 / 12));
    case "quincenal":
      return meses * 2;
    case "mensual":
      return meses;
    default:
      return null;
  }
};

/** Tabla_amortizacion::get_amortizacion */
export const getAmortizacion = (info = {}, plazoFraccion = false) => {
  let ivaRate = num(info.tasa_iva);
  if (ivaRate > 1) ivaRate /= 100;

  const capital = num(info.monto);
  let tasaOrdinaria = 0;
  if (truthy(info.tasa_anual)) {
    tasaOrdinaria = round(tasaPorPeriodo(num(info.tasa_anual), info.periodicidad), 3) / 100;
  } else if (num(info.tasa_ordinaria) > 0) {
    tasaOrdinaria = num(info.tasa_ordinaria);
  }

  const ret = { quantity: capital };
  ret.duration = plazoFraccion ? info.duracion : int(info.duracion);

  const plazo = int(info.plazo);
  const meses = num(ret.duration);
  const periodicidad = info.periodicidad;
  const paymentNumber = plazo === 0 ? numeroDePagos(meses, periodicidad) : plazo;
  const periodo = CODIGO_PERIODO[periodicidad] ?? periodicidad;

  const bullet = info.forma_pago === "bullet";
  const conGracia = int(info.aplica_periodo_gracia) === 1;
  const numeroPeriodosGracia = conGracia ? int(info.numero_periodos_gracia) : 0;

  const monthlyInterest = tasaOrdinaria * (1 + ivaRate);
  const factor = (n) => div(monthlyInterest * pow(1 + monthlyInterest, n), pow(1 + monthlyInterest, n) - 1);

  const dateStart = fechaInicioCotizador();

  let capital2 = capital;
  let pagoPeriodico = 0;
  let monthlyPayment;
  if (conGracia) {
    pagoPeriodico = capital * factor(paymentNumber - numeroPeriodosGracia);
    monthlyPayment = pagoPeriodico;
  } else {
    monthlyPayment = capital * factor(paymentNumber);
  }

  ret.paid = monthlyPayment;
  ret.MinMonthlyPayment = monthlyPayment;

  if (paymentNumber === null || !(paymentNumber >= 1)) return ret;

  ret.payments = [];
  for (let i = 1; i <= paymentNumber; i++) {
    const initialBalance = capital2;
    let payInterest = initialBalance * monthlyInterest;
    const iva = payInterest - payInterest / (1 + ivaRate);
    payInterest = payInterest / (1 + ivaRate);
    let payCapital;

    if (bullet) {
      monthlyPayment = iva + payInterest;
      payCapital = 0;
      if (i === paymentNumber) payCapital = monthlyPayment - initialBalance * monthlyInterest;
    } else if (conGracia) {
      monthlyPayment = iva + payInterest;
      payCapital = 0;
      if (i > numeroPeriodosGracia) {
        payCapital = pagoPeriodico - initialBalance * monthlyInterest;
        monthlyPayment = pagoPeriodico;
      }
    } else {
      payCapital = monthlyPayment - initialBalance * monthlyInterest;
    }

    capital2 -= payCapital;

    const payDate = i === 1 ? payDay(dateStart, 0, periodo) : payDay(ret.payments[i - 2].payDate, 1, periodo);

    if (i === paymentNumber) monthlyPayment = monthlyPayment + (initialBalance - payCapital);

    ret.payments.push({
      place: i,
      payDate,
      capital: initialBalance,
      interest: payInterest,
      amortized: payCapital,
      iva,
      final: capital2,
      paid: monthlyPayment,
      extraordinary: null,
      insurance: null,
    });
  }

  return ret;
};

/** Tabla_amortizacion::amortizacion_con_gracia (pagos indexados desde 1, como en PHP). */
export const amortizacionConGracia = (info = {}) => {
  // En el original la división del IVA no se asigna ($ivaRate /100;), se conserva igual.
  const ivaRate = num(info.tasa_iva);
  const capital = num(info.monto);
  const tasaRenovacion = num(info.tasa_renovacion);
  const meses = int(info.duracion);
  const periodicidad = info.periodicidad;
  const paymentNumber = numeroDePagos(meses, periodicidad);
  const periodo = CODIGO_PERIODO[periodicidad] ?? periodicidad;

  let pagosRenovacion = (paymentNumber ?? 0) - int(info.num_pagos_gracia);
  const dateStart = fechaInicioCotizador();

  const ret = {};
  if (paymentNumber === null || !(paymentNumber >= 1)) return ret;

  ret.payments = {};
  let capital2 = capital;
  let monthlyPayment = null;

  for (let i = 1; i <= paymentNumber; i++) {
    const initialBalance = capital2;
    const payInterest = initialBalance * tasaRenovacion;
    const iva = payInterest * ivaRate;
    let payCapital = 0;
    if (pagosRenovacion <= 0) {
      payCapital = num(info.pago_gracia);
      capital2 -= payCapital;
    }

    const payDate = i === 1 ? payDay(dateStart, 0, periodo) : payDay(ret.payments[i - 1].payDate, 1, periodo);

    if (i === paymentNumber) monthlyPayment = num(monthlyPayment) + (initialBalance - payCapital);

    ret.payments[i] = {
      place: i,
      payDate,
      capital: initialBalance,
      interest: payInterest,
      amortized: payCapital,
      iva,
      final: capital2,
      paid: monthlyPayment,
      extraordinary: null,
      insurance: null,
    };

    if (pagosRenovacion > 0) pagosRenovacion--;
  }

  return ret;
};
