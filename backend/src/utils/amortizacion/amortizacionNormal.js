// utils/amortizacion/amortizacionNormal.js
import { payDay } from "./payDay.js";

export const amortizacionNormal = (
  info,
  plazo = false,
) => {

  let ivaRate =
    Number(info.tasa_iva || 0);

  if (ivaRate > 1) {
    ivaRate =
      ivaRate / 100;
  }

  const capital =
    Number(info.monto);

  let tasa =
    Number(info.tasa_ordinaria || 0);

  if (tasa > 1) {
    tasa = tasa / 100;
  }

  const ret = {};

  ret.quantity = capital;

  ret.duration = plazo
    ? info.duracion
    : Number(info.duracion);

  let periodo =
    String(
      info.periodicidad || "",
    ).toLowerCase();

  let paymentNumber = 0;

  switch (periodo) {

    case "semanal":
      paymentNumber =
        Math.round(
          ret.duration * (52 / 12),
        );
      periodo = 110;
      break;

    case "catorcenal":
      paymentNumber =
        Math.round(
          ret.duration * (26 / 12),
        );
      periodo = 118;
      break;

    case "quincenal":
      paymentNumber =
        ret.duration * 2;
      periodo = 111;
      break;

    case "mensual":
      paymentNumber =
        ret.duration;
      periodo = 112;
      break;

    default:
      paymentNumber =
        ret.duration;
      periodo = 112;
      break;
  }

  /*
    PMT FORMULA
  */

  const tasaConIVA =
    tasa * (1 + ivaRate);

  const calculo1 =
    tasaConIVA *
    Math.pow(
      1 + tasaConIVA,
      paymentNumber,
    );

  const calculo2 =
    Math.pow(
      1 + tasaConIVA,
      paymentNumber,
    ) - 1;

  const pago =
    capital *
    (calculo1 / calculo2);

  let saldo =
    capital;

  ret.payments = [];

  const fechaInicio =
    new Date()
      .toISOString()
      .slice(0, 10);

  for (
    let i = 1;
    i <= paymentNumber;
    i++
  ) {

    const saldoInicial =
      saldo;

    /*
      INTERES SIN IVA
    */

    const interes =
      saldoInicial * tasa;

    /*
      IVA
    */

    const iva =
      interes * ivaRate;

    /*
      TOTAL INTERES
    */

    const interesTotal =
      interes + iva;

    /*
      CAPITAL
    */

    let capitalPagado =
      pago - interesTotal;

    /*
      AJUSTE ULTIMO PAGO
    */

    if (i === paymentNumber) {

      capitalPagado =
        saldoInicial;

      saldo = 0;

    } else {

      saldo -= capitalPagado;
    }

    const pagoFecha =
      i === 1
        ? payDay(
            fechaInicio,
            0,
            periodo,
          )
        : payDay(
            ret.payments[i - 2]
              .payDate,
            1,
            periodo,
          );

    ret.payments.push({

      place: i,

      payDate: pagoFecha,

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
          capitalPagado.toFixed(2),
        ),

      final:
        Number(
          saldo.toFixed(2),
        ),

      paid:
        Number(
          pago.toFixed(2),
        ),

      extraordinary: 0,

      insurance: 0,
    });
  }

  return ret;
};