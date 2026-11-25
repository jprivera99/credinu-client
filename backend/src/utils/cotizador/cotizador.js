// src/utils/cotizador/cotizador.js
// Traducción de application/helpers/cotizador_helper.php. Mismas reglas de negocio:
// límites por monto o por sueldos, capacidad de pago, comisión por apertura, fondo de garantía,
// periodos de gracia, adelantos y anticipo de aguinaldo.

import { num, int, isset, round, div, numberFormat, fixed2, hoy, PV, PMT } from "./php.js";
import { getAmortizacion, amortizacionConGracia } from "./tablaAmortizacion.js";
import { phpJsonEncode } from "../phpJson.js";

const lower = (v) => String(v ?? "").toLowerCase();

const pagosPorMeses = (meses, periodicidad) => {
  switch (lower(periodicidad)) {
    case "semanal":
      return round(meses * (52 / 12));
    case "catorcenal":
      return round(meses * (26 / 12));
    case "quincenal":
      return meses * 2;
    case "mensual":
      return meses;
    default:
      return null;
  }
};

const factorIngresoMensual = (periodicidad) =>
  ({ semanal: 52 / 12, catorcenal: 26 / 12, quincenal: 2, mensual: 1 })[lower(periodicidad)] ?? 0;

const sumaPagos = (payments) =>
  Object.values(payments || {}).reduce((acc, p) => acc + num(p.amortized) + num(p.interest) + num(p.iva), 0);

/* ------------------------------------------------------------------ */

export const calcularMontoMaxPrestamo = (producto, data) => {
  const tasaIva = 0.16;
  const maxMeses = isset(producto.duracion) ? num(producto.duracion) : num(producto.plazo_max);
  const tasaOrdinaria = num(producto.tasa) / 100;
  const paymentNumber = pagosPorMeses(maxMeses, producto.periodicidad);
  return PV(tasaOrdinaria * (1 + tasaIva), paymentNumber, -num(data.ingreso) * 0.3);
};

export const calculoPagoAnticipo = (producto, data) => {
  const montoSolicitado = num(data.monto);
  const ultimoIngreso = num(data.ingreso);
  const capacidadDePago = ultimoIngreso * 0.3;
  const tasaIva = 0.16;
  let montoAdelanto = montoSolicitado;
  const periodo = lower(producto.periodicidad);
  const factor = factorIngresoMensual(periodo);

  if (montoSolicitado > ultimoIngreso * factor) montoAdelanto = ultimoIngreso * factor;

  const tasaRenovacion = num(producto.tasa_renovacion) / 100;
  let pagoRenovacion = montoAdelanto * tasaRenovacion;
  pagoRenovacion = Math.ceil(pagoRenovacion * (1 + tasaIva));
  let decenas = int(String(pagoRenovacion).slice(-2));
  pagoRenovacion -= decenas;
  decenas = decenas < 50 ? 50 : 100;
  pagoRenovacion += decenas;

  const pagoMaximoAdelanto = capacidadDePago - pagoRenovacion;
  const numPagosBullet = Math.ceil(div(montoAdelanto, pagoMaximoAdelanto));
  const pagoAnticipo = div(montoAdelanto, numPagosBullet);

  const duracion = isset(producto.duracion) ? producto.duracion : producto.plazo_max;
  const paymentNumber = pagosPorMeses(num(duracion), periodo);

  const cumple = paymentNumber === null ? !(numPagosBullet !== 0) : !(numPagosBullet > paymentNumber);

  return {
    cumple,
    paymentNumber,
    periodicidad: periodo,
    duracion,
    pago_gracia: pagoAnticipo,
    num_pagos_gracia: numPagosBullet,
    monto_adelanto: montoAdelanto,
  };
};

/** Producto 1: Adelanto de nómina */
export const calculaAdelantoNomina = (productoOriginal, dataOriginal) => {
  const producto = { ...productoOriginal };
  const data = { ...dataOriginal };
  const info = { id: producto.id };
  const ultimoIngreso = num(data.ingreso);
  if (isset(producto.iva) && int(producto.iva) === 1) info.tasa_iva = 0.16;

  const tasaRenovacion = num(producto.tasa_renovacion) / 100;
  let pagoBullet = { cumple: false };

  const maxDin = ultimoIngreso * num(producto.monto_max);
  const minDin = ultimoIngreso * num(producto.monto_min);
  if (num(data.monto) > maxDin) data.monto = maxDin;
  else if (num(data.monto) < minDin) data.monto = minDin;

  const montoMaximo = num(calcularMontoMaxPrestamo(producto, data));
  if (num(data.monto) > montoMaximo) data.monto = montoMaximo;

  let vueltas = 0;
  while (!pagoBullet.cumple && (!isset(producto.duracion) || num(producto.duracion) <= num(producto.plazo_max)) && vueltas < 500) {
    pagoBullet = calculoPagoAnticipo(producto, data);
    producto.duracion = num(pagoBullet.duracion) + 1;
    vueltas++;
  }

  info.plazo_max = producto.plazo_max;
  info.plazo_min = producto.plazo_min;
  info.ultimo_ingreso = data.ingreso;
  info.monto = pagoBullet.monto_adelanto ?? null;
  info.duracion = pagoBullet.duracion ?? null;
  info.periodicidad = lower(producto.periodicidad);
  info.tasa_renovacion = tasaRenovacion;
  info.nombre_comercial = producto.nombre_comercial;
  info.tipo_producto = 1;
  info.pago_gracia = pagoBullet.pago_gracia ?? null;
  info.num_pagos_gracia = pagoBullet.num_pagos_gracia ?? null;
  info.num_pagos_adelanto = pagoBullet.num_pagos_gracia ?? null;
  info.monto_adelanto = pagoBullet.pago_gracia ?? null;
  info.antiguedad_producto = producto.antiguedad;

  const prod = { info: { ...info } };
  prod.amortizacion = amortizacionConGracia(info);
  prod.info.monto_adelanto = prod.amortizacion.payments?.[1]?.amortized ?? null;
  prod.info.monto_total = sumaPagos(prod.amortizacion.payments);
  return prod;
};

/** Producto 2: Anticipo de aguinaldo */
export const calculaAnticipioAguinaldo = (producto, data) => {
  const info = { id: producto.id };
  const ultimoIngreso = num(data.ingreso);
  const montoSolicitado = num(data.monto);
  if (isset(producto.iva) && int(producto.iva) === 1) info.tasa_iva = 0.16;

  info.plazo_max = producto.plazo_max;
  info.plazo_min = num(producto.plazo_min) < 1 ? 1 : producto.plazo_min;

  const tasaRenovacion = num(producto.tasa_renovacion) / 100;
  let montoAnticipo = montoSolicitado;

  if (num(producto.monto_max) > 0 || !isset(producto.monto_max)) {
    const maxDin = ultimoIngreso * num(producto.monto_max);
    const minDin = ultimoIngreso * num(producto.monto_min);
    if (montoSolicitado > maxDin) montoAnticipo = maxDin;
    else if (montoSolicitado < minDin) montoAnticipo = minDin;
  } else {
    const factor = factorIngresoMensual(producto.periodicidad);
    if (montoSolicitado > ultimoIngreso * factor) montoAnticipo = ultimoIngreso * factor;
  }

  const pagoAnticipo = montoAnticipo;
  info.plazo_min = num(producto.plazo_min) < 1 || !isset(producto.plazo_min) ? 1 : producto.plazo_min;

  let maxMeses = 0;
  const mesActual = hoy().m;
  if (mesActual >= 6) {
    maxMeses = 12 - mesActual;
    info.plazo_max = maxMeses;
  }

  info.duracion = isset(producto.duracion) ? producto.duracion : maxMeses;
  info.ultimo_ingreso = data.ingreso;
  info.monto = montoAnticipo;
  info.periodicidad = lower(producto.periodicidad);
  info.tasa_renovacion = tasaRenovacion;
  info.nombre_comercial = producto.nombre_comercial;
  info.tipo_producto = 2;
  info.pago_gracia = pagoAnticipo;
  info.num_pagos_gracia = 1;
  info.num_pagos_adelanto = info.num_pagos_gracia;
  info.monto_adelanto = pagoAnticipo;
  info.antiguedad_producto = producto.antiguedad;

  const prod = { info: { ...info } };
  prod.amortizacion = amortizacionConGracia(info);
  prod.info.monto_total = sumaPagos(prod.amortizacion.payments);
  return prod;
};

/** Producto 3: Préstamo personal */
export const calculoPrestamoPersonal = (producto, data) => {
  const info = { id: producto.id };
  if (isset(producto.iva) && int(producto.iva) === 1) info.tasa_iva = 0.16;
  info.plazo_max = producto.plazo_max;
  info.plazo_min = producto.plazo_min;

  let montoSolicitado = data.monto;
  const tasaOrdinaria = num(producto.tasa) / 100;

  if (num(montoSolicitado) > num(producto.monto_max)) montoSolicitado = producto.monto_max;
  else if (num(montoSolicitado) < num(producto.monto_min)) montoSolicitado = producto.monto_min;

  const montoMaximo = calcularMontoMaxPrestamo(producto, data);
  if (num(montoSolicitado) > num(montoMaximo)) montoSolicitado = montoMaximo;

  info.ultimo_ingreso = data.ingreso;
  info.monto = montoSolicitado;
  info.duracion = isset(producto.duracion) ? producto.duracion : producto.plazo_max;
  info.periodicidad = lower(producto.periodicidad);
  info.tasa_ordinaria = tasaOrdinaria;
  info.nombre_comercial = producto.nombre_comercial;
  info.tipo_producto = 3;
  info.num_pagos_adelanto = "";
  info.monto_adelanto = "";
  info.antiguedad_producto = producto.antiguedad;

  const prod = { info: { ...info } };
  prod.amortizacion = getAmortizacion(info);
  prod.info.monto_total = sumaPagos(prod.amortizacion.payments);
  return prod;
};

/** Producto 4: Adelanto de nómina a pagos fijos */
export const calculoAdelantoNominaPagosFijos = (producto, dataOriginal) => {
  const data = { ...dataOriginal };
  const info = { id: producto.id };
  let tasaIva = 0;
  if (isset(producto.iva) && int(producto.iva) === 1) {
    tasaIva = 0.16;
    info.tasa_iva = tasaIva;
  }
  info.plazo_max = producto.plazo_max;
  info.plazo_min = producto.plazo_min;

  const ultimoIngreso = num(data.ingreso);
  const tasaOrdinaria = num(producto.tasa) / 100;

  const maxDin = ultimoIngreso * num(producto.monto_max);
  const minDin = ultimoIngreso * num(producto.monto_min);
  if (num(data.monto) > maxDin) data.monto = maxDin;
  else if (num(data.monto) < minDin) data.monto = minDin;
  let montoSolicitado = num(data.monto);

  const maxMeses = isset(producto.duracion) ? producto.duracion : producto.plazo_max;
  const paymentNumber = pagosPorMeses(num(maxMeses), producto.periodicidad);
  const montoMaximo = num(PV(tasaOrdinaria * (1 + tasaIva), paymentNumber, -ultimoIngreso * 0.3));
  if (montoSolicitado > montoMaximo) montoSolicitado = montoMaximo;

  info.ultimo_ingreso = data.ingreso;
  info.monto = montoSolicitado;
  info.duracion = maxMeses;
  info.periodicidad = lower(producto.periodicidad);
  info.tasa_ordinaria = tasaOrdinaria;
  info.nombre_comercial = producto.nombre_comercial;
  info.tipo_producto = 4;
  info.num_pagos_adelanto = "";
  info.monto_adelanto = "";
  info.antiguedad_producto = producto.antiguedad;

  const prod = { info: { ...info } };
  prod.amortizacion = getAmortizacion(info);
  prod.info.monto_total = sumaPagos(prod.amortizacion.payments);
  return prod;
};

/** Producto 5: Salario on demand */
export const calculoSalarioDemanda = (productoOriginal, data) => {
  const producto = { ...productoOriginal };
  const info = { id: producto.id };
  const pagos = num(producto.num_pagos);
  let tasaIva = 0;
  if (isset(producto.iva) && int(producto.iva) === 1) {
    tasaIva = 0.16;
    info.tasa_iva = tasaIva;
  }

  let montoSolicitado = data.monto;
  const ultimoIngreso = num(data.ingreso);
  const tasaOrdinaria = num(producto.tasa) / 100;

  if (num(montoSolicitado) > num(producto.monto_max)) montoSolicitado = producto.monto_max;
  else if (num(montoSolicitado) < num(producto.monto_min)) montoSolicitado = producto.monto_min;

  switch (lower(producto.periodicidad)) {
    case "semanal":
      producto.duracion = (1 / (52 / 12)) * pagos;
      break;
    case "catorcenal":
      producto.duracion = (1 / (26 / 12)) * pagos;
      break;
    case "quincenal":
      producto.duracion = (1 / 2) * pagos;
      break;
    case "mensual":
      producto.duracion = producto.num_pagos; // PHP asigna el valor tal cual viene de la BD
      break;
  }

  const maxMeses = producto.duracion;
  info.plazo_max = producto.duracion;
  info.plazo_min = producto.duracion;

  const paymentNumber = pagosPorMeses(num(maxMeses), producto.periodicidad);
  const montoMaximo = num(PV(tasaOrdinaria * (1 + tasaIva), paymentNumber, -ultimoIngreso * 0.3));
  if (num(montoSolicitado) > montoMaximo) montoSolicitado = montoMaximo;

  info.ultimo_ingreso = data.ingreso;
  info.monto = montoSolicitado;
  info.duracion = maxMeses;
  info.periodicidad = lower(producto.periodicidad);
  info.tasa_ordinaria = tasaOrdinaria;
  info.nombre_comercial = producto.nombre_comercial;
  info.tipo_producto = 5;
  info.num_pagos_adelanto = "";
  info.monto_adelanto = "";
  info.antiguedad_producto = producto.antiguedad;
  info.num_pagos = producto.num_pagos;
  info.express = producto.express;

  const prod = { info: { ...info } };
  prod.amortizacion = getAmortizacion(info, true);
  prod.info.monto_total = sumaPagos(prod.amortizacion.payments);
  return prod;
};

/* ------------------------- Simulador parametrizado ------------------------- */

const jsonObj = (v) => {
  if (v && typeof v === "object") return v;
  try {
    const o = JSON.parse(v || "null");
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
};

/** config_simulador_producto */
export const configSimuladorProducto = (producto) => {
  const porCantidad = jsonObj(producto.limite_por_cantidad);
  const porSueldos = jsonObj(producto.limite_por_sueldos);
  const tasas = jsonObj(producto.tasas_periodos);
  const comision = jsonObj(producto.datos_comision_apertura);
  const fondo = jsonObj(producto.datos_fondo_garantia);
  const periodoGracia = jsonObj(producto.datos_periodo_gracia);

  const post = {
    id: producto.id,
    nombre: producto.nombre,
    tipo_limite: producto.tipo_limite,
    cantidad_minima: porCantidad.cantidad_minima,
    cantidad_maxima: porCantidad.cantidad_maxima,
    sueldo_minimo: porSueldos.sueldo_minimo,
    sueldo_maximo: porSueldos.sueldo_maximo,
    tasa: tasas.tasa || {},
    periodo_min: tasas.periodo_min || {},
    periodo_max: tasas.periodo_max || {},
    aplica_iva: producto.aplica_iva,
    porcen_iva: producto.porcen_iva,
    aplica_comision_apertura: producto.aplica_comision_apertura,
    porcen_comision_apertura: comision.porcen_comision_apertura,
    refinanciar_comision_apertura: comision.refinanciar_comision_apertura,
    aplica_fondo_garantia: producto.aplica_fondo_garantia,
    porcen_fondo_garantia: fondo.porcen_fondo_garantia,
    refinanciar_fondo_garantia: fondo.refinanciar_fondo_garantia,
    aplica_periodo_gracia: producto.aplica_periodo_gracia,
    periodo_gracia: periodoGracia,
    validar_capacidad_pago: producto.validar_capacidad_pago,
    porcen_capacidad_pago: producto.porcen_capacidad_pago,
    validar_antiguedad: producto.validar_antiguedad,
    meses_antiguedad: producto.meses_antiguedad,
    forma_pago: producto.forma_pago_capital,
    periodicidad: producto.periodicidad,
    disponible_mes: producto.disponible_desde_mes,
    disponible_dia: producto.disponible_desde_dia,
  };
  post.numero_periodos_gracia = int(periodoGracia[producto.periodicidad]);

  const cbo = {};
  for (const [kp, min] of Object.entries(post.periodo_min)) {
    if (int(min) > 0 && int(post.periodo_max[kp]) > 0) cbo[kp] = kp.charAt(0).toUpperCase() + kp.slice(1);
  }
  post.cbo_periodicidad = cbo;
  return post;
};

const validarLimite = (sim) => {
  const c = sim.cotizador;
  const solicitado = num(c.monto_solicitado);
  if (int(c.tipo_limite) === 1) {
    const minima = num(c.cantidad_minima);
    const maxima = num(c.cantidad_maxima);
    if (solicitado > 0) {
      if (solicitado >= minima && solicitado <= maxima) {
        sim.msg.limite = { ok: "LIMITE Correcto" };
        return true;
      } else if (solicitado < minima) {
        sim.cotizador.monto = minima;
        sim.msg.limite = { error: `El monto minimo es ${numberFormat(minima, 2)}` };
      } else {
        sim.cotizador.monto = maxima;
        sim.msg.limite = { error: `El monto maximo es ${numberFormat(maxima, 2)}` };
      }
    } else {
      sim.msg.limite = { error: "El monto debe ser mayor a cero " };
    }
  } else if (int(c.tipo_limite) === 2) {
    const sueldo = num(c.ultimo_sueldo);
    const sueldos = round(div(solicitado, sueldo), 2);
    const minimo = num((c.sueldo_minimo || {})[c.periodicidad]);
    const maximo = num((c.sueldo_maximo || {})[c.periodicidad]);
    if (sueldos > 0) {
      if (sueldos >= minimo && sueldos <= maximo) return true;
      if (sueldos < minimo) {
        sim.cotizador.monto = sueldo * minimo;
        sim.msg.limite = { error: `Sueldos solicitados ${sueldos}. El minimo es ${minimo} sueldo(s)` };
      } else if (sueldos > maximo) {
        sim.cotizador.monto = sueldo * maximo;
        sim.msg.limite = { error: `Sueldos solicitados ${sueldos}. El maximo es ${maximo} sueldo(s)` };
      }
    } else {
      sim.msg.limite = { error: "Sueldos solicitados debe ser mayor a cero" };
    }
  }
  return false;
};

const validarTasa = (sim) => {
  const c = sim.cotizador;
  if (num(c.tasa.anual) > 0) {
    sim.msg.tasa = { ok: `Tasa Correcto, Anual ${c.tasa.anual}%` };
    return true;
  }
  sim.msg.tasa = { error: "Especifique la Tasa Anual" };
  return false;
};

const validarIva = (sim) => {
  const c = sim.cotizador;
  if (int(c.aplica_iva) > 0) {
    if (int(c.aplica_iva) === 1) {
      if (num(c.porcen_iva) > 0) {
        sim.cotizador.tasa_iva = c.porcen_iva;
        sim.msg.iva = { ok: `Iva Correcto: Si Aplica al ${c.porcen_iva}%` };
        return true;
      }
      sim.msg.iva = { error: "Especifique el IVA en la configuraci\uFFFDn" };
      return false;
    }
    sim.msg.iva = { ok: "Iva Correcto: No Aplica" };
    return true;
  }
  sim.msg.iva = { error: "Especifique Si Aplica IVA" };
  return false;
};

const validarComisionApertura = (sim) => {
  const c = sim.cotizador;
  const aplica = int(c.aplica_comision_apertura);
  if (aplica === 0) {
    sim.msg.comision_apertura = { error: "Comisi&oacute;n por apertura no definida en la configuraci&oacute;n" };
    return false;
  }
  if (aplica === 2) {
    sim.msg.comision_apertura = { ok: "Comisi&oacute;n por apertura, No Aplica." };
    return true;
  }
  if (aplica === 1) {
    const porcen = num(c.porcen_comision_apertura);
    if (porcen > 0) {
      const comision = num(c.monto) * (porcen / 100);
      sim.cotizador.comision_apertura = comision;
      if (int(c.aplica_iva) === 1) sim.cotizador.comision_apertura_iva = comision * (num(c.porcen_iva) / 100);
      let refin = "no aplica refinanciamiento";
      if (int(c.refinanciar_comision_apertura) === 1) refin = "aplica refinanciamiento";
      else if (int(c.refinanciar_comision_apertura) === 0) refin = "(no definido el refinanciamiento en configuracion)";
      sim.msg.comision_apertura = { ok: `Comisi&oacute;n por apertura(${porcen} %): $${numberFormat(comision, 2)}  ${refin}` };
      return true;
    }
    sim.msg.comision_apertura = { error: "Porcentaje de comisi&oacute;n por apertura, no definida en configuracion." };
    return false;
  }
  sim.msg.comision_apertura = { error: "Especifique si aplica comision por apertura" };
  return false;
};

const pagoPeriodico = (sim) => {
  const c = sim.cotizador;
  const plazo = int(c.plazo);
  const iva = num(c.tasa_iva) / 100;
  const tasa = (num(c.tasa[c.periodicidad]) / 100) * (1 + iva);
  sim.cotizador.tmp = { pago_periodico: { numeros_de_pago: plazo } };
  return PMT(tasa, plazo, num(c.monto) * -1);
};

const validarCapacidadPago = (sim) => {
  const c = sim.cotizador;
  if (int(c.validar_capacidad_pago) !== 1) return;
  let porcen = num(c.porcen_capacidad_pago);
  const sueldo = num(c.ultimo_sueldo);
  if (porcen > 0) {
    const montoPorPeriodo = num(pagoPeriodico(sim));
    porcen /= 100;
    const capacidad = sueldo * porcen;
    if (capacidad > montoPorPeriodo) {
      sim.msg.capacidad_pago = { ok: "Capacidad de Pago Correcto " };
      return;
    }
    const numeros = int(sim.cotizador.tmp.pago_periodico.numeros_de_pago);
    const tasa = num(sim.cotizador.tasa[c.periodicidad]) / 100;
    const tasaIva = num(sim.cotizador.tasa_iva) / 100;
    const montoMaximo = PV(tasa * (1 + tasaIva), numeros, -capacidad);
    const monto = (sim.cotizador.monto = Math.floor(num(montoMaximo)));
    const strPeriodo = c.periodicidad ? `por ${c.periodicidad}` : "";
    sim.msg.capacidad_pago = {
      error: `El maximo que el cliente puede pagar ${strPeriodo} es: $${numberFormat(capacidad, 2)} Monto Maximo: $${numberFormat(monto, 0)}`,
    };
  } else {
    sim.msg.capacidad_pago = { error: "Especifique el % de capacidad de pago en la configuraci\uFFFDn" };
  }
};

const validarAntiguedad = (sim) => {
  const c = sim.cotizador;
  const v = int(c.validar_antiguedad);
  if (v === 0) sim.msg.antiguedad = { error: "Antiguedad no definida en la configuraci&oacute;n" };
  else if (v === 2) sim.msg.antiguedad = { ok: "Antiguedad No Aplica." };
  else if (v === 1) {
    if (int(c.meses_antiguedad) === 0) sim.msg.antiguedad = { error: "Meses de antiguedad no definida en la configuraci&oacute;n" };
    else if (int(c.cliente_antiguedad) < int(c.meses_antiguedad))
      sim.msg.antiguedad = { error: "La Antiguedad del cliente es menor a la configurada." };
    else sim.msg.antiguedad = { ok: "Antiguedad Correcta." };
  }
};

/** calcularFechaDisponible: timestamp UNIX (zona del servidor, UTC-6) o false */
export const calcularFechaDisponible = (producto) => {
  const mes = int(producto?.disponible_desde_mes);
  const dia = int(producto?.disponible_desde_dia);
  if (mes === 0 || dia === 0) return false;
  const anio = hoy().y;
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  if (d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return false;
  return Date.UTC(anio, mes - 1, dia, 6, 0, 0) / 1000;
};

/** contarPagos / contarRepeticiones */
export const contarPagos = (tabla) => {
  const conteo = new Map();
  for (const p of Object.values(tabla?.payments || {})) {
    if (p && isset(p.paid)) {
      const clave = fixed2(p.paid);
      conteo.set(clave, (conteo.get(clave) || 0) + 1);
    }
  }
  return [...conteo.entries()].map(([valor, veces]) => ({ valor, veces }));
};

/**
 * calcularProductorSimulador.
 * @param Producto  fila de institucion_producto (con duracion si el cliente eligió plazo)
 * @param simProducto fila de simulador_producto
 */
export const calcularProductorSimulador = (Producto, simProducto, data) => {
  const config = configSimuladorProducto(simProducto || {});
  const cotizador = {
    producto_id: Producto.id_producto_simulador,
    ultimo_sueldo: String(data.ingreso).replace(/,/g, ""),
    monto_solicitado: String(data.monto).replace(/,/g, ""),
    ...config,
  };
  cotizador.monto = cotizador.monto_solicitado;
  cotizador.tasa_anual = cotizador.tasa.anual;

  if (!isset(Producto.duracion) || num(Producto.duracion) <= 0) {
    cotizador.plazo = num(cotizador.periodo_max[cotizador.periodicidad]);
  } else {
    cotizador.plazo = Producto.duracion;
  }

  const sim = { cotizador, msg: {} };
  validarLimite(sim);
  validarTasa(sim);
  validarIva(sim);
  validarComisionApertura(sim);
  validarCapacidadPago(sim);
  validarAntiguedad(sim);

  let tabla = {};
  if (num(sim.cotizador.monto) > 0 && num(sim.cotizador.tasa_anual) > 0) {
    tabla = getAmortizacion(sim.cotizador);
  }

  let totalPago = 0;
  for (const p of tabla.payments || []) totalPago += round(p.paid, 2);

  const c = sim.cotizador;
  const info = {
    id: Producto.id,
    plazo_max: c.periodo_max[c.periodicidad],
    plazo_min: c.periodo_min[c.periodicidad],
    ultimo_ingreso: c.ultimo_sueldo,
    monto: c.monto,
    duracion: c.plazo,
    periodicidad: c.periodicidad,
    tasa_renovacion: "pendiente",
    tasa_ordinaria: c.tasa_anual,
    nombre_comercial: c.nombre,
    tipo_producto: Producto.producto_id,
    num_pagos_adelanto: "",
    monto_adelanto: "",
    antiguedad_producto: "",
    monto_total: totalPago,
    monto_cantida_pagos: phpJsonEncode(contarPagos(tabla)),
  };

  if (int(c.aplica_periodo_gracia) === 1) {
    info.pago_gracia = "";
    info.num_pagos_gracia = c.periodo_gracia[c.periodicidad];
  }
  if (int(c.aplica_comision_apertura) === 1) info.porcen_comision_apertura = c.porcen_comision_apertura;
  if (int(c.aplica_fondo_garantia) === 1) info.porcen_fondo_garantia = c.porcen_fondo_garantia;
  if (int(c.aplica_iva) === 1) info.tasa_iva = c.porcen_iva;

  const fecha = calcularFechaDisponible(simProducto);
  if (fecha !== false) info.fecha_disponible = fecha;

  info.msg = sim.msg;

  // Pagos indexados desde 1 (igual que el sistema actual).
  let pays = "";
  if (tabla.payments && tabla.payments.length) {
    pays = {};
    tabla.payments.forEach((p, i) => {
      pays[i + 1] = p;
    });
  }

  info.pruducto = simProducto;
  return { info, amortizacion: { payments: pays } };
};

/**
 * Calcula un producto (institucion_producto) con el cotizador que le corresponde.
 * @param producto fila de institucion_producto, con `prod_simulador` (fila de simulador_producto) si aplica
 */
export const calcularProducto = (producto, data) => {
  if (isset(producto.id_producto_simulador)) {
    return calcularProductorSimulador(producto, producto.prod_simulador, data);
  }
  switch (int(producto.producto_id)) {
    case 1:
      return calculaAdelantoNomina(producto, data);
    case 2:
      return calculaAnticipioAguinaldo(producto, data);
    case 3:
      return calculoPrestamoPersonal(producto, data);
    case 4:
      return calculoAdelantoNominaPagosFijos(producto, data);
    case 5:
      return calculoSalarioDemanda(producto, data);
    default:
      return null;
  }
};
