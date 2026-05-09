// utils/cotizador.js

import { amortizacionConGracia }
from "./amortizacion/amortizacionConGracia.js";

import { calcularPrestamoPersonal }
from "./productos/prestamoPersonal.js";

export const calcularAdelantoNomina = (
  producto,
  data,
) => {

  const tasaIVA = 0.16;

  const ultimoIngreso =
    Number(data.ingreso);

  let montoSolicitado =
    Number(data.monto);

  const capacidadDePago =
    ultimoIngreso * 0.3;

  const capacidadMensual =
    capacidadDePago * 2;

  let montoAdelanto =
    montoSolicitado;

  if (
    montoSolicitado >
    ultimoIngreso * 2
  ) {

    montoAdelanto =
      ultimoIngreso * 2;
  }

  const comisionApertura =
    Number(
      producto.comision_apertura || 0,
    ) / 100;

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

  const info = {

    ultimo_ingreso:
      ultimoIngreso,

    monto:
      montoAdelanto,

    tasa_iva:
      tasaIVA,

    duracion: 6,

    periodicidad:
      String(
        producto.periodicidad || "",
      ).toLowerCase(),

    tasa_renovacion:
      tasaRenovacion,

    tipo_producto:
      "ADELANTO_NOMINA",

    pago_gracia:
      pagoAnticipo,

    num_pagos_gracia:
      numPagosBullet,
  };

  const amortizacion =
    amortizacionConGracia(
      info,
    );

  return {

    producto_id:
      producto.producto_id,

    nombre:
      producto.nombre,

    monto_aprobado:
      Number(
        montoAdelanto.toFixed(2),
      ),

    plazo:
      numPagosBullet,

    pago_periodico:
      Number(
        pagoAnticipo.toFixed(2),
      ),

    pago_por_renovacion:
      pagoPorRenovacion,

    capacidad_pago:
      Number(
        capacidadDePago.toFixed(2),
      ),

    capacidad_mensual:
      Number(
        capacidadMensual.toFixed(2),
      ),

    detalle:
      amortizacion,

    periodicidad:
      String(
        producto.periodicidad || "",
      ).toLowerCase(),
  };
};

export {
  calcularPrestamoPersonal,
};