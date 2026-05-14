// utils/productos/calcularSalarioDemanda.js

import { amortizacionNormal } from "../amortizacion/amortizacionNormal.js";
import { PV } from "../amortizacion/formulas.js";

export const calcularSalarioDemanda = (producto, data) => {
  const tasaIVA = Number(producto.iva) === 1 ? 0.16 : 0;

  const ingreso = Number(data.ingreso);

  let monto = Number(data.monto);

  const montoMin = Number(producto.monto_min || 0);
  const montoMax = Number(producto.monto_max || 0);

  if (montoMin > 0 && monto < montoMin) {
    monto = montoMin;
  }

  if (montoMax > 0 && monto > montoMax) {
    monto = montoMax;
  }

  const capacidadPago = ingreso * 0.3;

  const capacidadMensual = capacidadPago * 2;

  const tasa = Number(producto.tasa || 0) / 100;

  const periodicidad = String(producto.periodicidad || "").toLowerCase();
  const numPagos = Math.max(1, Number(producto.num_pagos || 0));

  const pagosMes =
    periodicidad === "semanal"
      ? 52 / 12
      : periodicidad === "catorcenal"
        ? 26 / 12
        : periodicidad === "quincenal"
          ? 2
          : 1;

  const duracion = numPagos / pagosMes;

  if (ingreso > 0 && tasa > 0 && numPagos > 0) {
    const montoMaximoCapacidad = PV(
      tasa * (1 + tasaIVA),
      numPagos,
      -(ingreso * 0.3),
    );

    if (Number.isFinite(montoMaximoCapacidad) && montoMaximoCapacidad > 0) {
      monto = Math.min(monto, montoMaximoCapacidad);
    }
  }

  if (montoMin > 0 && monto < montoMin) {
    monto = montoMin;
  }

  const info = {
    monto,

    tasa_iva: tasaIVA,

    tasa_ordinaria: tasa,

    periodicidad,

    duracion,

    fecha_inicio: new Date().toISOString().slice(0, 10),

    forma_pago: "normal",
  };

  const detalle = amortizacionNormal(info);

  let pagoPeriodico = 0;

  if (detalle.payments && detalle.payments.length > 0) {
    pagoPeriodico = detalle.payments[0].paid;
  }

  return {
    id: producto.id,

    nombre: producto.nombre,

    monto_aprobado: Number(monto.toFixed(2)),

    plazo: numPagos,

    plazo_min: numPagos,

    plazo_max: numPagos,

    pago_periodico: Number(pagoPeriodico.toFixed(2)),

    capacidad_pago: Number(capacidadPago.toFixed(2)),

    capacidad_mensual: Number(capacidadMensual.toFixed(2)),

    detalle,

    periodicidad,
  };
};
