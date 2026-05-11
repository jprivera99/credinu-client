// services/quotation.service.js

import { getProductByInstitutionQuotation }
from "../products/products.service.js";

import { pool }
from "../../config/db.js";

import {
  calcularAdelantoNomina,
} from "../../utils/productos/adelantoNomina.js";

import {
  calcularPrestamoPersonal,
} from "../../utils/productos/prestamoPersonal.js";

import {
  calcularAnticipoAguinaldo,
} from "../../utils/productos/anticipoAguinaldo.js";

import {
  calcularAdelantoNominaPagosFijos,
} from "../../utils/productos/adelantoNominaPagosFijos.js";

import {
  calcularSalarioDemanda,
} from "../../utils/productos/salarioDemanda.js";

export const cotizarService = async ({
  monto,
  ingreso,
  institucion_id,
}) => {

  const productos =
    await getProductByInstitutionQuotation(
      institucion_id,
    );

  const resultados = [];

  for (const key in productos) {

    const prod =
      productos[key];

    let resultado = null;

    switch (
      Number(prod.producto_id)
    ) {

      // ADELANTO NOMINA
      case 1:

        resultado =
          calcularAdelantoNomina(
            prod,
            {
              monto,
              ingreso,
            },
          );

        break;

      // ANTICIPO AGUINALDO
      case 2:

        resultado =
          calcularAnticipoAguinaldo(
            prod,
            {
              monto,
              ingreso,
            },
          );

        break;

      // PRESTAMO PERSONAL
      case 3:

        resultado =
          calcularPrestamoPersonal(
            prod,
            {
              monto,
              ingreso,
            },
          );

        break;

      // ADELANTO NOMINA PAGOS FIJOS
      case 4:

        resultado =
          calcularAdelantoNominaPagosFijos(
            prod,
            {
              monto,
              ingreso,
            },
          );

        break;

      // SALARIO DEMANDA
      case 5:

        resultado =
          calcularSalarioDemanda(
            prod,
            {
              monto,
              ingreso,
            },
          );

        break;

      default:
        break;
    }

    if (resultado) {
      resultados.push(
        resultado,
      );
    }
  }

  return resultados;
};

export const detalleService = async ({
  monto,
  plazo,
  producto_id,
  institucion_id,
}) => {

  const [[producto]] =
    await pool.query(
      `
      SELECT
        ip.*,
        p.nombre
      FROM institucion_producto ip
      INNER JOIN producto p
        ON p.id = ip.producto_id
      WHERE ip.producto_id = ?
      AND ip.institucion_id = ?
      LIMIT 1
      `,
      [
        producto_id,
        institucion_id,
      ],
    );

  if (!producto) {
    return null;
  }

  const tasa =
    Number(producto.tasa || 0) / 100;

  const pago =
    (
      monto * tasa
    ) /
    (
      1 -
      Math.pow(
        1 + tasa,
        -plazo,
      )
    );

  let saldo =
    Number(monto);

  const tabla = [];

  for (
    let i = 1;
    i <= plazo;
    i++
  ) {

    const interes =
      saldo * tasa;

    const capital =
      pago - interes;

    const saldoFinal =
      saldo - capital;

    tabla.push({

      periodo: i,

      saldo_inicial:
        Number(
          saldo.toFixed(2),
        ),

      interes:
        Number(
          interes.toFixed(2),
        ),

      capital:
        Number(
          capital.toFixed(2),
        ),

      pago:
        Number(
          pago.toFixed(2),
        ),

      saldo_final:
        Number(
          saldoFinal.toFixed(2),
        ),
    });

    saldo =
      saldoFinal;
  }

  return {

    producto:
      producto.nombre,

    monto:
      Number(monto),

    plazo:
      Number(plazo),

    tasa:
      Number(
        (
          tasa * 100
        ).toFixed(2),
      ),

    pago:
      Number(
        pago.toFixed(2),
      ),

    tabla,
  };
};