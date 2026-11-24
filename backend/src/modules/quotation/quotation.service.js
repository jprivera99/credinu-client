// src/modules/quotation/quotation.service.js
//
// La cotización se calcula con el cotizador del sistema actual (cotizador_helper.php)
// a través del puente. Así el monto, plazo, comisiones, fondo de garantía y la tabla
// de amortización son idénticos a los que usa el administrador para generar el contrato.
// (Los cálculos en utils/productos y utils/amortizacion quedaron como referencia, pero no
// reproducen todas las reglas del simulador parametrizado; no se usan para dinero real.)

import { callBridge } from "../../utils/bridge.js";
import { AppError } from "../../utils/appError.js";

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

/** Tabla de pagos del cotizador PHP -> formato del portal. */
export const mapPayments = (payments = []) =>
  (Array.isArray(payments) ? payments : Object.values(payments || {})).map((p, idx) => ({
    periodo: Number(p.place ?? idx + 1),
    fecha: p.payDate || null,
    saldo_inicial: round2(p.capital),
    interes: round2(p.interest),
    iva: round2(p.iva),
    capital: round2(p.amortized),
    pago: round2(p.paid),
    saldo_final: round2(p.final),
  }));

const validarMontos = ({ monto, ingreso }) => {
  if (!monto || Number(monto) <= 0) throw new AppError("El monto es requerido", 400);
  if (!ingreso || Number(ingreso) <= 0) throw new AppError("El ingreso es requerido", 400);
};

/**
 * COTIZAR: productos disponibles para la institución del cliente.
 */
export const cotizarService = async ({ user, monto, ingreso }) => {
  validarMontos({ monto, ingreso });

  const productos = await callBridge("cotizar", user, {
    monto: Number(monto),
    ingreso: Number(ingreso),
  });

  return (productos || [])
    .filter((p) => Number(p.monto) > 0 && Number(p.num_pagos) > 0)
    .map((p) => ({
      id: p.id,
      producto_id: p.producto_id,
      nombre_comercial: p.nombre_comercial,
      monto_aprobado: round2(p.monto),
      // Número de pagos (lo que ve el cliente) y duración (lo que espera el cotizador).
      plazo: p.num_pagos,
      duracion: p.duracion,
      periodicidad: p.periodicidad,
      pago_periodico: round2(p.pago),
      total_pagar: round2(p.monto_total),
      express: p.express,
      fecha_disponible: p.fecha_disponible,
    }))
    .sort((a, b) => b.monto_aprobado - a.monto_aprobado);
};

/**
 * DETALLE: recalcula un producto con el monto y la duración elegidos.
 */
export const detalleService = async ({ user, id, monto, plazo, ingreso }) => {
  validarMontos({ monto, ingreso });
  if (!id) throw new AppError("Producto requerido", 400);

  const d = await callBridge("detalle", user, {
    institucion_producto_id: Number(id),
    monto: Number(monto),
    ingreso: Number(ingreso),
    duracion: Number(plazo) || 0,
  });

  const tabla = mapPayments(d.tabla);
  const total = tabla.reduce((acc, r) => acc + r.pago, 0);

  return {
    id: d.id,
    producto: d.nombre_comercial,
    monto: round2(d.monto),
    plazo: Number(d.duracion),
    plazo_min: Number(d.plazo_min || d.duracion),
    plazo_max: Number(d.plazo_max || d.duracion),
    periodicidad: d.periodicidad,
    num_pagos: d.num_pagos,
    tasa: d.tasa_ordinaria != null ? round2(Number(d.tasa_ordinaria) * (Number(d.tasa_ordinaria) < 1 ? 100 : 1)) : null,
    pago: round2(d.pago),
    total_pagar: round2(d.monto_total || total),
    pagos_resumen: d.monto_cantida_pagos || null,
    express: d.express,
    detalle_completo: d.detalle_completo,
    fecha_disponible: d.fecha_disponible,
    mensajes: d.msg || null,
    tabla,
  };
};
