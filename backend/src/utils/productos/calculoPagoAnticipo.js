export const calculoPagoAnticipo = (
  producto,
  data,
) => {

  const montoSolicitado =
    Number(data.monto);

  const ultimoIngreso =
    Number(data.ingreso);

  const capacidadDePago =
    ultimoIngreso * 0.3;

  const tasaIVA = 0.16;

  let montoAdelanto =
    montoSolicitado;

  const periodo =
    String(
      producto.periodicidad || "",
    ).toLowerCase();

  let factorIngresoMensual = 0;

  switch (periodo) {

    case "semanal":
      factorIngresoMensual = 52 / 12;
      break;

    case "catorcenal":
      factorIngresoMensual = 26 / 12;
      break;

    case "quincenal":
      factorIngresoMensual = 2;
      break;

    case "mensual":
      factorIngresoMensual = 1;
      break;
  }

  if (
    montoSolicitado >
    ultimoIngreso *
      factorIngresoMensual
  ) {

    montoAdelanto =
      ultimoIngreso *
      factorIngresoMensual;
  }

  const tasaRenovacion =
    Number(
      producto.tasa_renovacion || 0,
    ) / 100;

  let pagoPorRenovacion =
    montoAdelanto *
    tasaRenovacion;

  pagoPorRenovacion =
    Math.ceil(
      pagoPorRenovacion *
      (1 + tasaIVA),
    );

  let decenas =
    Number(
      String(
        pagoPorRenovacion,
      ).slice(-2),
    );

  pagoPorRenovacion -= decenas;

  decenas =
    decenas < 50
      ? 50
      : 100;

  pagoPorRenovacion += decenas;

  const pagoMaximoAdelanto =
    capacidadDePago -
    pagoPorRenovacion;

  const numPagosBullet =
    Math.ceil(
      montoAdelanto /
      pagoMaximoAdelanto,
    );

  const pagoAnticipo =
    montoAdelanto /
    numPagosBullet;

  let duracion =
    producto.duracion
      ? Number(
          producto.duracion,
        )
      : Number(
          producto.plazo_min,
        );

  let paymentNumber = 0;

  switch (periodo) {

    case "semanal":
      paymentNumber = Math.round(
        duracion * (52 / 12),
      );
      break;

    case "catorcenal":
      paymentNumber = Math.round(
        duracion * (26 / 12),
      );
      break;

    case "quincenal":
      paymentNumber =
        duracion * 2;
      break;

    case "mensual":
      paymentNumber =
        duracion;
      break;
  }

  return {

    cumple:
      numPagosBullet <=
      paymentNumber,

    paymentNumber,

    periodicidad:
      periodo,

    duracion,

    pago_gracia:
      pagoAnticipo,

    num_pagos_gracia:
      numPagosBullet,

    monto_adelanto:
      montoAdelanto,
  };
};