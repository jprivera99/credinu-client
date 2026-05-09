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

  let tasa_ordinaria = 0;

  if (
    Number(info.tasa_ordinaria) > 0
  ) {

    tasa_ordinaria =
      Number(
        info.tasa_ordinaria,
      );

  } else {

    tasa_ordinaria =
      Number(
        info.tasa_anual || 0,
      ) / 100;
  }

  const ret = {};

  ret.quantity = capital;

  if (plazo) {

    ret.duration =
      info.duracion;

  } else {

    ret.duration =
      parseInt(
        info.duracion,
      );
  }

  const meses =
    ret.duration;

  let periodo =
    info.periodicidad;

  let paymentNumber = 0;

  if (
    Number(info.plazo || 0) === 0
  ) {

    switch (periodo) {

      case "semanal":
        paymentNumber =
          Math.round(
            meses *
            (52 / 12),
          );
        periodo = 110;
        break;

      case "decenal":
        paymentNumber =
          Math.round(
            meses *
            (36 / 12),
          );
        periodo = 1157;
        break;

      case "catorcenal":
        paymentNumber =
          Math.round(
            meses *
            (26 / 12),
          );
        periodo = 118;
        break;

      case "quincenal":
        paymentNumber =
          meses * 2;
        periodo = 111;
        break;

      case "mensual":
        paymentNumber =
          meses;
        periodo = 112;
        break;
    }

  } else {

    paymentNumber =
      Number(info.plazo);

    switch (periodo) {

      case "semanal":
        periodo = 110;
        break;

      case "decenal":
        periodo = 1157;
        break;

      case "catorcenal":
        periodo = 118;
        break;

      case "quincenal":
        periodo = 111;
        break;

      case "mensual":
        periodo = 112;
        break;
    }
  }

  const aplica_pago_bullet =
    info.forma_pago === "bullet"
      ? 1
      : 0;

  let aplica_periodos_gracia = 0;
  let numero_periodos_gracia = 0;

  if (
    Number(
      info.aplica_periodo_gracia,
    ) === 1
  ) {

    aplica_periodos_gracia = 1;

    numero_periodos_gracia =
      Number(
        info.numero_periodos_gracia,
      );
  }

  let monthlyInterest =
    tasa_ordinaria;

  monthlyInterest *=
    1 + ivaRate;

  let dateStart =
    info.fecha_inicio;

  if (
    !dateStart ||
    String(dateStart).length !== 10
  ) {

    const now =
      new Date();

    const dia =
      now.getDate();

    const anio =
      now.getFullYear();

    const mes =
      now.getMonth() + 1;

    if (dia <= 15) {

      dateStart =
        `${anio}-${String(mes).padStart(2, "0")}-15`;

    } else {

      const lastDay =
        new Date(
          anio,
          mes,
          0,
        ).getDate();

      dateStart =
        `${anio}-${String(mes).padStart(2, "0")}-${lastDay}`;
    }
  }

  let capital2 = capital;

  let monthlyPayment = 0;
  let pago_periodico = 0;

  if (
    aplica_periodos_gracia === 1
  ) {

    const pagos_con_capital =
      paymentNumber -
      numero_periodos_gracia;

    const calculo1 =
      monthlyInterest *
      Math.pow(
        1 + monthlyInterest,
        pagos_con_capital,
      );

    const calculo2 =
      Math.pow(
        1 + monthlyInterest,
        pagos_con_capital,
      ) - 1;

    pago_periodico =
      capital *
      (calculo1 / calculo2);

    monthlyPayment =
      pago_periodico;

  } else {

    const calculo1 =
      monthlyInterest *
      Math.pow(
        1 + monthlyInterest,
        paymentNumber,
      );

    const calculo2 =
      Math.pow(
        1 + monthlyInterest,
        paymentNumber,
      ) - 1;

    monthlyPayment =
      capital *
      (calculo1 / calculo2);
  }

  ret.payments = [];

  for (
    let i = 1;
    i <= paymentNumber;
    i++
  ) {

    const initialBalance =
      capital2;

    let payInterest = 0;
    let iva = 0;
    let payCapital = 0;

    if (
      aplica_pago_bullet === 1
    ) {

      payInterest =
        initialBalance *
        monthlyInterest;

      iva =
        payInterest -
        (
          payInterest /
          (1 + ivaRate)
        );

      payInterest =
        payInterest /
        (1 + ivaRate);

      monthlyPayment =
        iva + payInterest;

      payCapital = 0;

      if (
        i === paymentNumber
      ) {

        payCapital =
          monthlyPayment -
          (
            initialBalance *
            monthlyInterest
          );
      }

    } else if (
      aplica_periodos_gracia === 1
    ) {

      payInterest =
        initialBalance *
        monthlyInterest;

      iva =
        payInterest -
        (
          payInterest /
          (1 + ivaRate)
        );

      payInterest =
        payInterest /
        (1 + ivaRate);

      monthlyPayment =
        iva + payInterest;

      payCapital = 0;

      if (
        i >
        numero_periodos_gracia
      ) {

        payCapital =
          pago_periodico -
          (
            initialBalance *
            monthlyInterest
          );

        monthlyPayment =
          pago_periodico;
      }

    } else {

      payInterest =
        initialBalance *
        monthlyInterest;

      iva =
        payInterest -
        (
          payInterest /
          (1 + ivaRate)
        );

      payInterest =
        payInterest /
        (1 + ivaRate);

      payCapital =
        monthlyPayment -
        (
          initialBalance *
          monthlyInterest
        );
    }

    capital2 -= payCapital;

    let payDate;

    if (i === 1) {

      payDate =
        payDay(
          dateStart,
          i - 1,
          periodo,
        );

    } else {

      payDate =
        payDay(
          ret.payments[i - 2]
            .payDate,
          1,
          periodo,
        );
    }

    if (
      i === paymentNumber
    ) {

      monthlyPayment =
        monthlyPayment +
        (
          initialBalance -
          payCapital
        );
    }

    ret.payments.push({
      place: i,

      payDate,

      capital: Number(
        initialBalance.toFixed(2),
      ),

      interest: Number(
        payInterest.toFixed(2),
      ),

      amortized: Number(
        payCapital.toFixed(2),
      ),

      iva: Number(
        iva.toFixed(2),
      ),

      final: Number(
        capital2.toFixed(2),
      ),

      paid: Number(
        monthlyPayment.toFixed(2),
      ),

      extraordinary: 0,

      insurance: 0,
    });
  }

  return ret;
};