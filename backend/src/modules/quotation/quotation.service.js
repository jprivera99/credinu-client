// src/modules/quotation/quotation.service.js

import { pool } from "../../config/db.js";
import { amortizacionNormal } from "../../utils/amortizacion/amortizacionNormal.js";
import { PV } from "../../utils/amortizacion/formulas.js";

import { getProductByInstitutionQuotation } from "../products/products.service.js";

import { calcularAdelantoNomina } from "../../utils/productos/adelantoNomina.js";

import { calcularAnticipoAguinaldo } from "../../utils/productos/anticipoAguinaldo.js";

import { calcularPrestamoPersonal } from "../../utils/productos/prestamoPersonal.js";

import { calcularAdelantoNominaPagosFijos } from "../../utils/productos/adelantoNominaPagosFijos.js";

import { calcularSalarioDemanda } from "../../utils/productos/salarioDemanda.js";

/**
 * OBTENER CALCULADORA SEGUN PRODUCTO
 */
const calculadoras = {
  1: calcularAdelantoNomina,
  2: calcularAnticipoAguinaldo,
  3: calcularPrestamoPersonal,
  4: calcularAdelantoNominaPagosFijos,
  5: calcularSalarioDemanda,
};

const clamp = (value, min, max) => {
  if (Number.isFinite(min) && value < min) return min;
  if (Number.isFinite(max) && value > max) return max;
  return value;
};

const getPaymentNumber = (duracion, periodicidad) => {
  const meses = Number(duracion);
  const periodo = String(periodicidad || "").toLowerCase();

  switch (periodo) {
    case "semanal":
      return Math.round(meses * (52 / 12));
    case "catorcenal":
      return Math.round(meses * (26 / 12));
    case "quincenal":
      return Math.round(meses * 2);
    case "mensual":
    default:
      return Math.round(meses);
  }
};

const getPagosMes = (periodicidad) => {
  const periodo = String(periodicidad || "").toLowerCase();

  switch (periodo) {
    case "semanal":
      return 52 / 12;
    case "catorcenal":
      return 26 / 12;
    case "quincenal":
      return 2;
    case "mensual":
    default:
      return 1;
  }
};

/**
 * COTIZAR
 */
export const cotizarService = async ({ monto, ingreso, institucion_id }) => {
  /*
  VALIDACIONES
  */

  if (!monto || Number(monto) <= 0) {
    throw new Error("El monto es requerido");
  }

  if (!ingreso || Number(ingreso) <= 0) {
    throw new Error("El ingreso es requerido");
  }

  /*
  OBTENER PRODUCTOS
  */

  const productos = await getProductByInstitutionQuotation(institucion_id);

  if (!productos || productos.length === 0) {
    return [];
  }

  /*
  RECORRER PRODUCTOS
  */

  const resultados = [];

  for (const producto of productos) {
    /*
    BUSCAR FUNCION
    */

    const calcular = calculadoras[Number(producto.producto_id)];

    /*
    SI NO EXISTE FUNCION
    */

    if (!calcular) {
      continue;
    }

    try {
      /*
      CALCULAR
      */

      const resultado = calcular(producto, {
        monto: Number(monto),

        ingreso: Number(ingreso),
      });

      /*
      AGREGAR RESULTADO
      */

      if (resultado) {
        const periodicidadResultado = String(
          resultado.periodicidad || producto.periodicidad || "",
        ).toLowerCase();

        const pagosMes = getPagosMes(periodicidadResultado);

        const plazoResultado = Number(resultado.plazo || 0);

        const plazoComoPagos =
          Number(producto.num_pagos || 0) > 0
            ? Number(producto.num_pagos)
            : periodicidadResultado === "mensual"
              ? Math.round(plazoResultado)
              : Math.max(1, Math.round(plazoResultado * pagosMes));

        resultados.push({
          ...resultado,
          plazo: plazoComoPagos,

          /*
    NORMALIZAR CAMPOS
    */

          producto_id: Number(producto.producto_id),

          nombre: resultado.nombre || producto.nombre || "",

          nombre_comercial:
            resultado.nombre_comercial ||
            producto.nombre_comercial ||
            producto.nombre ||
            "",

          periodicidad: periodicidadResultado,
        });
      }
    } catch (error) {
      console.error(`ERROR PRODUCTO ${producto.producto_id}:`, error.message);
    }
  }

  /*
  ORDENAR POR MONTO
  */

  resultados.sort(
    (a, b) => Number(b.monto_aprobado) - Number(a.monto_aprobado),
  );

  return resultados;
};

/**
 * DETALLE
 */

export const detalleService = async ({ id, monto, plazo, ingreso, institucion_id }) => {
  const [rows] = await pool.query(
    `
    SELECT
      ip.*,
      p.nombre
    FROM institucion_producto ip
    INNER JOIN producto p
      ON p.id = ip.producto_id
    WHERE ip.id = ?
      AND ip.institucion_id = ?
    LIMIT 1
    `,
    [id, institucion_id],
  );

  const producto = rows?.[0];

  if (!producto) {
    throw new Error("Producto no encontrado");
  }

  const periodicidad = String(producto.periodicidad || "").toLowerCase();
  const pagosMes = getPagosMes(periodicidad);
  const numPagosFijo = Number(producto.num_pagos || 0);

  const tasa = Number(producto.tasa || 0) / 100;
  const tasaIVA = Number(producto.iva) === 1 ? 0.16 : 0;

  const plazoMinMeses = Number(producto.plazo_min || 1);
  const plazoMaxRaw = Number(producto.plazo_max || plazoMinMeses);
  const plazoMaxMeses = plazoMaxRaw >= plazoMinMeses ? plazoMaxRaw : plazoMinMeses;

  const plazoMinPagos = numPagosFijo > 0
    ? numPagosFijo
    : getPaymentNumber(plazoMinMeses, periodicidad);

  const plazoMaxPagos = numPagosFijo > 0
    ? numPagosFijo
    : getPaymentNumber(plazoMaxMeses, periodicidad);

  const plazoSolicitadoPagos = Number(plazo);
  const plazoPagosAjustado = clamp(
    Number.isFinite(plazoSolicitadoPagos) && plazoSolicitadoPagos > 0
      ? plazoSolicitadoPagos
      : plazoMaxPagos,
    plazoMinPagos,
    plazoMaxPagos,
  );

  const plazoAjustadoMeses = plazoPagosAjustado / pagosMes;

  const montoSolicitado = Number(monto);

  let montoAjustado = Number.isFinite(montoSolicitado) && montoSolicitado > 0
    ? montoSolicitado
    : Number(producto.monto_min || 0);

  const montoMin = Number(producto.monto_min || 0);
  const montoMax = Number(producto.monto_max || 0);

  if (montoMin > 0) {
    montoAjustado = Math.max(montoAjustado, montoMin);
  }

  if (montoMax > 0) {
    montoAjustado = Math.min(montoAjustado, montoMax);
  }

  const ingresoNum = Number(ingreso || 0);
  const paymentNumber = Math.max(1, Math.round(plazoPagosAjustado));

  if (ingresoNum > 0 && tasa > 0 && paymentNumber > 0) {
    const montoMaximoCapacidad = PV(
      tasa * (1 + tasaIVA),
      paymentNumber,
      -(ingresoNum * 0.3),
    );

    if (Number.isFinite(montoMaximoCapacidad) && montoMaximoCapacidad > 0) {
      montoAjustado = Math.min(montoAjustado, montoMaximoCapacidad);
    }
  }

  if (montoMin > 0) {
    montoAjustado = Math.max(montoAjustado, montoMin);
  }

  const detalle = amortizacionNormal({
    monto: montoAjustado,
    tasa_iva: tasaIVA,
    tasa_ordinaria: tasa,
    periodicidad,
    duracion: plazoAjustadoMeses,
  });

  const tabla = (detalle.payments || []).map((row) => ({
    periodo: row.place,
    saldo_inicial: Number(row.capital.toFixed(2)),
    interes: Number(row.interest.toFixed(2)),
    capital: Number(row.amortized.toFixed(2)),
    pago: Number(row.paid.toFixed(2)),
    saldo_final: Number(row.final.toFixed(2)),
  }));

  const pago = tabla.length > 0 ? Number(tabla[0].pago.toFixed(2)) : 0;
  const totalPagar = Number(
    tabla.reduce((acc, row) => acc + Number(row.pago || 0), 0).toFixed(2),
  );

  return {
    id: producto.id,

    producto_id: producto.producto_id,

    producto: producto.nombre_comercial || producto.nombre,

    monto: Number(montoAjustado.toFixed(2)),

    plazo: Number(plazoPagosAjustado),

    plazo_min: Number(plazoMinPagos),

    plazo_max: Number(plazoMaxPagos),

    monto_min: Number(montoMin || 0),

    monto_max: Number(montoMax || 0),

    periodicidad,

    num_pagos: tabla.length,

    tasa: Number((tasa * 100).toFixed(2)),

    pago: Number(pago.toFixed(2)),

    total_pagar: totalPagar,

    tabla,
  };
};
