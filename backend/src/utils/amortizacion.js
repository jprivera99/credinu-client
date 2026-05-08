// utils/amortizacion.js
import { payDay } from "./payDay.js";

export const amortizacionConGracia = (info) => {

  // VARIABLES
  const tasa_ordinaria_aplica_iva =
    Number(info.tasa_iva) > 0 ? 1 : 0;

  let ivaRate = Number(info.tasa_iva);

  if (ivaRate > 1) {
    ivaRate = ivaRate / 100;
  }

  const capital = Number(info.monto);

  const tasa_renovacion =
    Number(info.tasa_renovacion);

  const meses = Number(info.duracion);

  let periodo = info.periodicidad;

  let paymentNumber = 0;

  // PERIODICIDAD
  switch (periodo) {

    case "semanal":
      {
        const factor_semana = 52 / 12;

        paymentNumber = Math.round(
          meses * factor_semana
        );

        periodo = 110;
      }
      break;

    case "decenal":
      {
        const factor_semana = 36 / 12;

        paymentNumber = Math.round(
          meses * factor_semana
        );

        periodo = 1157;
      }
      break;

    case "catorcenal":
      {
        const factor_catorcena = 26 / 12;

        paymentNumber = Math.round(
          meses * factor_catorcena
        );

        periodo = 118;
      }
      break;

    case "quincenal":
      paymentNumber = meses * 2;
      periodo = 111;
      break;

    case "mensual":
      paymentNumber = meses;
      periodo = 112;
      break;
  }

  // PAGOS RENOVACION
  let pagos_renovacion =
    paymentNumber -
    Number(info.num_pagos_gracia);

  // FECHA INICIAL
  let dateStart = new Date();

  const dia = dateStart.getDate();
  const anio = dateStart.getFullYear();
  const mes = dateStart.getMonth() + 1;

  if (dia <= 15) {
    dateStart = new Date(anio, mes - 1, 15);
  } else {
    dateStart = new Date(
      anio,
      mes,
      0
    );
  }

  // CAPITAL
  let capital2 = capital;

  const ret = {
    payments: {},
  };

  // LOOP
  for (let i = 1; i <= paymentNumber; i++) {

    const initialBalance = capital2;

    let payInterest = 0;
    let iva = 0;
    let payCapital = 0;

    // RENOVACION
    if (pagos_renovacion > 0) {

      payInterest =
        initialBalance *
        tasa_renovacion;

      iva =
        payInterest *
        ivaRate;

      payCapital = 0;

    } else {

      payInterest =
        initialBalance *
        tasa_renovacion;

      iva =
        payInterest *
        ivaRate;

      payCapital =
        Number(info.pago_gracia);

      capital2 -= payCapital;
    }

    // FECHAS
    let payDate;

    if (i === 1) {

      payDate = payDay(
        dateStart,
        i - 1,
        periodo
      );

    } else {

      payDate = payDay(
        ret.payments[i - 1].payDate,
        1,
        periodo
      );
    }

    // PAGO TOTAL
    const monthlyPayment =
      payInterest +
      iva +
      payCapital;

    // RESPONSE
    ret.payments[i] = {

      place: i,

      payDate,

      capital: Number(
        initialBalance.toFixed(2)
      ),

      interest: Number(
        payInterest.toFixed(2)
      ),

      amortized: Number(
        payCapital.toFixed(2)
      ),

      iva: Number(
        iva.toFixed(2)
      ),

      final: Number(
        capital2.toFixed(2)
      ),

      paid: Number(
        monthlyPayment.toFixed(2)
      ),

      extraordinary: 0,

      insurance: 0,
    };

    // DECREMENTO
    if (pagos_renovacion > 0) {
      pagos_renovacion--;
    }
  }

  return ret;
};