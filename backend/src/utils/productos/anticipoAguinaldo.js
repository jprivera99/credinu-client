// utils/productos/calcularAnticipoAguinaldo.js

import {
  amortizacionConGracia,
} from "../amortizacion/amortizacion.js";

export const calcularAnticipoAguinaldo = (
  producto,
  data,
) => {

  const tasaIVA = 0.16;

  const ingreso =
    Number(data.ingreso);

  let monto =
    Number(data.monto);

  // MAXIMO 1.5 INGRESOS
  const montoMaximo =
    ingreso * 1.5;

  if (monto > montoMaximo) {
    monto = montoMaximo;
  }

  const capacidadPago =
    ingreso * 0.25;

  const capacidadMensual =
    capacidadPago * 2;

  const tasaRenovacion =
    Number(
      producto.tasa_renovacion || 0,
    ) / 100;

  let pagoRenovacion =
    monto *
    tasaRenovacion;

  pagoRenovacion =
    Math.ceil(
      pagoRenovacion *
      (1 + tasaIVA),
    );

  // REDONDEO PHP
  let decenas =
    Number(
      String(
        pagoRenovacion,
      ).slice(-2),
    );

  pagoRenovacion -= decenas;

  decenas =
    decenas < 50
      ? 50
      : 100;

  pagoRenovacion += decenas;

  const pagoMaximo =
    capacidadPago -
    pagoRenovacion;

  const plazo =
    Math.ceil(
      monto /
      pagoMaximo,
    );

  const pagoCapital =
    monto / plazo;

  const info = {

    monto,

    tasa_iva:
      tasaIVA,

    duracion: 6,

    periodicidad:
      String(
        producto.periodicidad || "",
      ).toLowerCase(),

    tasa_renovacion:
      tasaRenovacion,

    pago_gracia:
      pagoCapital,

    num_pagos_gracia:
      plazo,
  };

  const detalle =
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
        monto.toFixed(2),
      ),

    plazo,

    pago_periodico:
      Number(
        pagoCapital.toFixed(2),
      ),

    pago_por_renovacion:
      pagoRenovacion,

    capacidad_pago:
      Number(
        capacidadPago.toFixed(2),
      ),

    capacidad_mensual:
      Number(
        capacidadMensual.toFixed(2),
      ),

    detalle,

    periodicidad:
      String(
        producto.periodicidad || "",
      ).toLowerCase(),
  };
};