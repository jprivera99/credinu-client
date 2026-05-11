// utils/amortizacion/amortizacion.js

export const amortizacionConGracia = (
  info,
) => {

  const ivaRate =
    Number(info.tasa_iva) || 0;

  const capitalInicial =
    Number(info.monto);

  const tasaRenovacion =
    Number(
      info.tasa_renovacion,
    );

  const meses =
    Number(info.duracion);

  const periodicidad =
    info.periodicidad;

  let paymentNumber = 0;

  switch (periodicidad) {

    case "semanal":

      paymentNumber =
        Math.round(
          meses * (52 / 12),
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

  let capital =
    capitalInicial;

  const payments = [];

  for (
    let i = 1;
    i <= paymentNumber;
    i++
  ) {

    const saldoInicial =
      capital;

    const interes =
      saldoInicial *
      tasaRenovacion;

    const iva =
      interes * ivaRate;

    let amortizacion = 0;

    if (
      pagosRenovacion <= 0
    ) {

      amortizacion =
        Number(
          info.pago_gracia,
        );

      capital -=
        amortizacion;
    }

    payments.push({

      periodo: i,

      saldo_inicial:
        Number(
          saldoInicial.toFixed(
            2,
          ),
        ),

      interest:
        Number(
          interes.toFixed(
            2,
          ),
        ),

      iva:
        Number(
          iva.toFixed(2),
        ),

      amortized:
        Number(
          amortizacion.toFixed(
            2,
          ),
        ),

      saldo_final:
        Number(
          capital.toFixed(2),
        ),

      paid:
        Number(
          (
            amortizacion +
            interes +
            iva
          ).toFixed(2),
        ),
    });

    if (
      pagosRenovacion > 0
    ) {

      pagosRenovacion--;
    }
  }

  return {
    payments,
  };
};