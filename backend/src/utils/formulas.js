// utils/formulas.js

export const pv = (
  rate,
  nper,
  pmt,
) => {

  if (rate === 0) {
    return -(
      pmt * nper
    );
  }

  return (
    (
      pmt *
      (
        1 -
        Math.pow(
          1 + rate,
          -nper,
        )
      )
    ) / rate
  );
};

export const calcularMontoMaxPrestamo =
  (
    producto,
    data,
  ) => {

    const tasaIVA =
      0.16;

    const maxMeses =
      Number(
        producto.duracion ||
        producto.plazo_max,
      );

    const tasaOrdinaria =
      Number(
        producto.tasa || 0,
      ) / 100;

    const ultimoIngreso =
      Number(
        data.ingreso,
      );

    let paymentNumber =
      maxMeses;

    switch (
      String(
        producto.periodicidad,
      ).toLowerCase()
    ) {

      case "semanal":

        paymentNumber =
          Math.round(
            maxMeses *
            (52 / 12),
          );

        break;

      case "catorcenal":

        paymentNumber =
          Math.round(
            maxMeses *
            (26 / 12),
          );

        break;

      case "quincenal":

        paymentNumber =
          maxMeses * 2;

        break;

      case "mensual":

        paymentNumber =
          maxMeses;

        break;
    }

    return pv(
      tasaOrdinaria *
      (1 + tasaIVA),

      paymentNumber,

      -(ultimoIngreso * 0.3),
    );
  };