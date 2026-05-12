// utils/amortizacion/amortizacion.js

export const amortizacionConGracia = (
  info,
) => {

  const ivaRate =
    Number(info.tasa_iva || 0);

  const capital =
    Number(info.monto);

  const tasaRenovacion =
    Number(info.tasa_renovacion);

  const meses =
    Number(info.duracion);

  let periodo =
    String(
      info.periodicidad || "",
    ).toLowerCase();

  let paymentNumber = 0;

  switch (periodo) {

    case "semanal":

      paymentNumber =
        Math.round(
          meses * (52 / 12),
        );

      break;

    case "decenal":

      paymentNumber =
        Math.round(
          meses * (36 / 12),
        );

      break;

    case "catorcenal":

      paymentNumber =
        Math.round(
          meses * (26 / 12),
        );

      break;

    case "quincenal":

      paymentNumber =
        meses * 2;

      break;

    case "mensual":

      paymentNumber =
        meses;

      break;
  }

  let pagosRenovacion =
    paymentNumber -
    Number(
      info.num_pagos_gracia,
    );

  let capitalRestante =
    capital;

  const payments = [];

  for (
    let i = 1;
    i <= paymentNumber;
    i++
  ) {

    const saldoInicial =
      capitalRestante;

    let interes = 0;

    let iva = 0;

    let amortizado = 0;

    /*
    SOLO RENOVACION
    */

    if (pagosRenovacion > 0) {

      interes =
        saldoInicial *
        tasaRenovacion;

      iva =
        interes * ivaRate;

      amortizado = 0;
    }

    /*
    PAGO NORMAL
    */

    else {

      interes =
        saldoInicial *
        tasaRenovacion;

      iva =
        interes * ivaRate;

      amortizado =
        Number(
          info.pago_gracia,
        );

      capitalRestante -=
        amortizado;
    }

    const pagoTotal =
      interes +
      iva +
      amortizado;

    payments.push({

      place: i,

      capital:
        Number(
          saldoInicial.toFixed(2),
        ),

      interest:
        Number(
          interes.toFixed(2),
        ),

      iva:
        Number(
          iva.toFixed(2),
        ),

      amortized:
        Number(
          amortizado.toFixed(2),
        ),

      final:
        Number(
          capitalRestante.toFixed(2),
        ),

      paid:
        Number(
          pagoTotal.toFixed(2),
        ),
    });

    if (pagosRenovacion > 0) {
      pagosRenovacion--;
    }
  }

  return {
    payments,
  };
};