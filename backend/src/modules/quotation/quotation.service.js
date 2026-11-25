// src/modules/quotation/quotation.service.js
// Cotización con el cotizador traducido del sistema actual (utils/cotizador), validado contra el
// PHP original. Así los montos, plazos y la tabla de pagos son los mismos que ve el administrador.

import { AppError } from "../../utils/appError.js";
import { calcularProducto } from "../../utils/cotizador/cotizador.js";
import { getProductosPorInstitucion } from "./productos.repository.js";

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const pagosDe = (amortizacion) => {
  const p = amortizacion?.payments;
  if (!p || typeof p !== "object") return [];
  return Array.isArray(p) ? p : Object.values(p);
};

/** Pago de un periodo: el sistema actual usa capital + interés + IVA. */
const pagoDe = (p) => Number(p?.amortized || 0) + Number(p?.interest || 0) + Number(p?.iva || 0);

/** Tabla de pagos -> formato del portal. */
export const mapPayments = (payments = []) =>
  (Array.isArray(payments) ? payments : Object.values(payments || {})).map((p, idx) => ({
    periodo: Number(p.place ?? idx + 1),
    fecha: p.payDate || null,
    saldo_inicial: round2(p.capital),
    interes: round2(p.interest),
    iva: round2(p.iva),
    capital: round2(p.amortized),
    pago: round2(p.paid !== null && p.paid !== undefined && p.paid !== "" ? p.paid : pagoDe(p)),
    saldo_final: round2(p.final),
  }));

const validarMontos = ({ monto, ingreso }) => {
  if (!monto || Number(monto) <= 0) throw new AppError("El monto es requerido", 400);
  if (!ingreso || Number(ingreso) <= 0) throw new AppError("El ingreso es requerido", 400);
};

const fechaDisponible = (info) =>
  info?.fecha_disponible ? new Date(Number(info.fecha_disponible) * 1000).toISOString().slice(0, 10) : null;

const resumen = (producto, prod) => {
  const info = prod.info || {};
  const pagos = pagosDe(prod.amortizacion);
  const primero = pagos.find((p) => pagoDe(p) > 0) || pagos[0];
  return {
    id: Number(producto.id),
    producto_id: Number(producto.producto_id) || null,
    nombre_comercial: info.nombre_comercial || producto.nombre_comercial || "",
    monto: Number(info.monto || 0),
    duracion: Number(info.duracion || 0),
    plazo_min: info.plazo_min,
    plazo_max: info.plazo_max,
    periodicidad: String(info.periodicidad || producto.periodicidad || "").toLowerCase(),
    num_pagos: pagos.length,
    pago: round2(primero ? pagoDe(primero) : 0),
    monto_total: Number(info.monto_total || 0),
    tasa_ordinaria: info.tasa_ordinaria ?? null,
    pagos_resumen: info.monto_cantida_pagos ? JSON.parse(info.monto_cantida_pagos) : null,
    express: Number(producto.express || 0),
    detalle_completo: Number(producto.detalle_completo || 0),
    requiere_autorizacion_rh: Number(producto.requiere_autorizacion_rh || 0),
    fecha_disponible: fechaDisponible(info),
  };
};

/**
 * Calcula un producto de la institución del cliente (rama de propuesta_detalle).
 * Regresa también {info, amortizacion} tal como se guarda en solicitud.amortizacion.
 */
export const calcularProductoCliente = async ({ user, institucion_producto_id, monto, ingreso, duracion }) => {
  validarMontos({ monto, ingreso });
  const productos = await getProductosPorInstitucion(user.institucion_id);
  const producto = productos.find((p) => Number(p.id) === Number(institucion_producto_id));
  if (!producto) throw new AppError("Producto no disponible", 404);

  const p = { ...producto };
  // En el sistema actual la duración llega como (int) y el monto/ingreso como (double).
  if (Number(duracion) > 0) p.duracion = Math.trunc(Number(duracion));

  const prod = calcularProducto(p, { ingreso: Number(ingreso), monto: Number(monto) });
  if (!prod || !prod.info) throw new AppError("No fue posible cotizar el producto", 422);
  return { producto, prod };
};

/** COTIZAR: productos disponibles para la institución del cliente. */
export const cotizarService = async ({ user, monto, ingreso }) => {
  validarMontos({ monto, ingreso });
  const productos = await getProductosPorInstitucion(user.institucion_id);
  const data = { ingreso: Number(ingreso), monto: Number(monto) };

  return productos
    .map((producto) => {
      const prod = calcularProducto({ ...producto }, data);
      return prod ? resumen(producto, prod) : null;
    })
    .filter((p) => p && p.monto > 0 && p.num_pagos > 0)
    .map((p) => ({
      id: p.id,
      producto_id: p.producto_id,
      nombre_comercial: p.nombre_comercial,
      monto_aprobado: round2(p.monto),
      plazo: p.num_pagos,
      duracion: p.duracion,
      periodicidad: p.periodicidad,
      pago_periodico: p.pago,
      total_pagar: round2(p.monto_total),
      express: p.express,
      fecha_disponible: p.fecha_disponible,
    }))
    .sort((a, b) => b.monto_aprobado - a.monto_aprobado);
};

/** DETALLE: recalcula un producto con el monto y la duración elegidos. */
export const detalleService = async ({ user, id, monto, plazo, ingreso }) => {
  if (!id) throw new AppError("Producto requerido", 400);
  const { producto, prod } = await calcularProductoCliente({
    user,
    institucion_producto_id: id,
    monto,
    ingreso,
    duracion: plazo,
  });
  const r = resumen(producto, prod);
  const tabla = mapPayments(prod.amortizacion?.payments);
  const tasa = r.tasa_ordinaria !== null && r.tasa_ordinaria !== "" ? Number(r.tasa_ordinaria) : null;

  return {
    id: r.id,
    producto: r.nombre_comercial,
    monto: round2(r.monto),
    plazo: r.duracion,
    plazo_min: Number(r.plazo_min || r.duracion),
    plazo_max: Number(r.plazo_max || r.duracion),
    periodicidad: r.periodicidad,
    num_pagos: r.num_pagos,
    tasa: tasa === null || Number.isNaN(tasa) ? null : round2(tasa < 1 ? tasa * 100 : tasa),
    pago: r.pago,
    total_pagar: round2(r.monto_total || tabla.reduce((a, f) => a + f.pago, 0)),
    pagos_resumen: r.pagos_resumen,
    express: r.express,
    detalle_completo: r.detalle_completo,
    fecha_disponible: r.fecha_disponible,
    mensajes: prod.info?.msg || null,
    tabla,
  };
};
