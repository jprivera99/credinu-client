// src/modules/quotation/quotation.service.js

import { pool } from "../../config/db.js";

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
        resultados.push({
          ...resultado,

          /*
          NORMALIZAR CAMPOS
          */

          producto_id: Number(resultado.producto_id),

          nombre: resultado.nombre || producto.nombre || "",

          nombre_comercial:
            resultado.nombre_comercial ||
            producto.nombre_comercial ||
            producto.nombre ||
            "",

          periodicidad: String(
            resultado.periodicidad || producto.periodicidad || "",
          ).toLowerCase(),
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

export const detalleService = async ({ id, monto, plazo }) => {
  const [rows] = await pool.query(
    `
    SELECT
      ip.*,
      p.nombre
    FROM institucion_producto ip
    INNER JOIN producto p
      ON p.id = ip.producto_id
    WHERE ip.id = ?
    LIMIT 1
    `,
    [id],
  );

  const producto = rows?.[0];

  if (!producto) {
    throw new Error("Producto no encontrado");
  }

  const tasa = Number(producto.tasa || 0) / 100;

  const pago = (monto * tasa) / (1 - Math.pow(1 + tasa, -plazo));

  let saldo = Number(monto);

  const tabla = [];

  for (let i = 1; i <= plazo; i++) {
    const interes = saldo * tasa;

    let capital = pago - interes;

    let saldoFinal = saldo - capital;

    if (i === plazo) {
      capital = saldo;

      saldoFinal = 0;
    }

    tabla.push({
      periodo: i,

      saldo_inicial: Number(saldo.toFixed(2)),

      interes: Number(interes.toFixed(2)),

      capital: Number(capital.toFixed(2)),

      pago: Number((capital + interes).toFixed(2)),

      saldo_final: Number(saldoFinal.toFixed(2)),
    });

    saldo = saldoFinal;
  }

  return {
    producto: producto.nombre_comercial || producto.nombre,

    monto: Number(monto),

    plazo: Number(plazo),

    tasa: Number((tasa * 100).toFixed(2)),

    pago: Number(pago.toFixed(2)),

    tabla,
  };
};
