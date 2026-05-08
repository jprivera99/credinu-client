// utils/cotizador.js

import { amortizacionConGracia } from "./amortizacion.js";

export const calcularAdelantoNomina = (producto, data) => {

  // VARIABLES BASE
  const tasaIVA = 0.16;

  const ultimoIngreso = Number(data.ingreso);
  let montoSolicitado = Number(data.monto);

  // CAPACIDAD DE PAGO
  const capacidadDePago = ultimoIngreso * 0.3;
  const capacidadMensual = capacidadDePago * 2;

  // MONTO ADELANTO
  let montoAdelanto = montoSolicitado;

  if (montoSolicitado > ultimoIngreso * 2) {
    montoAdelanto = ultimoIngreso * 2;
  }

  // TASAS
  const comisionApertura =
    Number(producto.comision_apertura || 0) / 100;

  const tasaRenovacion =
    Number(producto.tasa_renovacion || 0) / 100;

  // PAGO POR RENOVACIÓN
  let pagoPorRenovacion =
    montoAdelanto * tasaRenovacion;

  pagoPorRenovacion = Math.ceil(
    pagoPorRenovacion * (1 + tasaIVA)
  );

  // REDONDEO EXACTO PHP

  let decenas = Number(
    String(pagoPorRenovacion).slice(-2)
  );

  pagoPorRenovacion -= decenas;

  decenas = decenas < 50 ? 50 : 100;

  pagoPorRenovacion += decenas;

  // PAGO MÁXIMO
  const pagoMaximoAdelanto =
    capacidadDePago - pagoPorRenovacion;


  // NÚMERO DE PAGOS
  const numPagosBullet = Math.ceil(
    montoAdelanto / pagoMaximoAdelanto
  );

  // PAGO POR QUINCENA
  const pagoAnticipo =
    montoAdelanto / numPagosBullet;

  // INFO
  const info = {
    ultimo_ingreso: ultimoIngreso,
    monto: montoAdelanto,
    tasa_iva: tasaIVA,
    duracion: 6,
    periodicidad: String(
      producto.periodicidad || ""
    ).toLowerCase(),
    tasa_renovacion: tasaRenovacion,
    tipo_producto: "ADELANTO_NOMINA",

    pago_gracia: pagoAnticipo,
    num_pagos_gracia: numPagosBullet,
  };

  // TABLA AMORTIZACIÓN
  const amortizacion =
    amortizacionConGracia(info);

  // RESPUESTA
  return {
    producto_id: producto.producto_id,
    nombre: producto.nombre,

    monto_aprobado: Number(
      montoAdelanto.toFixed(2)
    ),

    plazo: numPagosBullet,

    pago_periodico: Number(
      pagoAnticipo.toFixed(2)
    ),

    pago_por_renovacion: pagoPorRenovacion,

    capacidad_pago: Number(
      capacidadDePago.toFixed(2)
    ),

    capacidad_mensual: Number(
      capacidadMensual.toFixed(2)
    ),

    detalle: amortizacion,
  };
};