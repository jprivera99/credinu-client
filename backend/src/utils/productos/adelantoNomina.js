// utils/productos/adelantoNomina.js

import { amortizacionConGracia } from "../amortizacion/amortizacion.js";

import { calculoPagoAnticipo } from "./calculoPagoAnticipo.js";

export const calcularAdelantoNomina = (producto, data) => {
  const tasaIVA = 0.16;

  const ultimoIngreso = Number(data.ingreso);

  let montoSolicitado = Number(data.monto);

  const capacidadDePago = ultimoIngreso * 0.3;

  const capacidadMensual = capacidadDePago * 2;

  let montoAdelanto = montoSolicitado;

  if (montoSolicitado > ultimoIngreso * 2) {
    montoAdelanto = ultimoIngreso * 2;
  }

  const tasaRenovacion = Number(producto.tasa_renovacion || 0) / 100;

  let pagoPorRenovacion = montoAdelanto * tasaRenovacion;

  pagoPorRenovacion = Math.ceil(pagoPorRenovacion * (1 + tasaIVA));

  let decenas = Number(String(pagoPorRenovacion).slice(-2));

  pagoPorRenovacion -= decenas;

  decenas = decenas < 50 ? 50 : 100;

  pagoPorRenovacion += decenas;

  const pagoMaximoAdelanto = capacidadDePago - pagoPorRenovacion;

  let pagoBullet = {
    cumple: false,
  };

  producto.duracion = Number(producto.plazo_min);

  while (
    !pagoBullet.cumple &&
    producto.duracion <= Number(producto.plazo_max)
  ) {
    pagoBullet = calculoPagoAnticipo(producto, data);

    producto.duracion++;
  }

  const info = {
    monto: montoAdelanto,

    tasa_iva: tasaIVA,

    duracion: pagoBullet.duracion,

    periodicidad: String(producto.periodicidad || "").toLowerCase(),

    tasa_renovacion: tasaRenovacion,

    pago_gracia: pagoBullet.pago_gracia,

    num_pagos_gracia: pagoBullet.num_pagos_gracia,
  };

  const detalle = amortizacionConGracia(info);

  return {
    id: producto.id,

    nombre: producto.nombre,

    monto_aprobado: Number(montoAdelanto.toFixed(2)),

    plazo: pagoBullet.num_pagos_gracia,

    pago_periodico: Number(pagoBullet.pago_gracia.toFixed(2)),

    pago_por_renovacion: pagoPorRenovacion,

    capacidad_pago: Number(capacidadDePago.toFixed(2)),

    capacidad_mensual: Number(capacidadMensual.toFixed(2)),

    detalle,

    periodicidad: String(producto.periodicidad || "").toLowerCase(),
  };
};
