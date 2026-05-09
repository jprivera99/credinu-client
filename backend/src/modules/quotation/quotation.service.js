// services/quotation.service.js

import { getProductByInstitutionQuotation } from "../products/products.service.js";
import {
  calcularAdelantoNomina,
  calcularAnticipoAguinaldo,
  calcularPrestamoPersonal,
  calcularAdelantoNominaPagosFijos,
  calcularSalarioDemanda,
} from "../../utils/amortizacion/amortizacionConGracia.js";
import { pool } from "../../config/db.js";
import { json } from "express";

export const cotizarService = async ({ monto, ingreso, institucion_id }) => {
  const productos = await getProductByInstitutionQuotation(institucion_id);

  const resultados = [];

  for (const key in productos) {
    const prod = productos[key];

    let resultado = null;

    switch (Number(prod.producto_id)) {
      case 1:
        resultado = calcularAdelantoNomina(prod, {
          monto,
          ingreso,
        });
        break;

      case 2:
        resultado = calcularAnticipoAguinaldo(prod, {
          monto,
          ingreso,
        });
        break;

      case 3:
        resultado = calcularPrestamoPersonal(prod, {
          monto,
          ingreso,
        });
        break;

      case 4:
        resultado = calcularAdelantoNominaPagosFijos(prod, {
          monto,
          ingreso,
        });
        break;

      case 5:
        resultado = calcularSalarioDemanda(prod, {
          monto,
          ingreso,
        });
        break;
    }

    if (resultado) {
      resultados.push(resultado);
    }
  }

  console.log(resultados);

  return resultados;
};

export const detalleService = async ({
  monto,
  plazo,
  producto_id,
  institucion_id,
  cliente_id,
}) => {
  const [[producto]] = await pool.query(
    `
    SELECT ip.*, p.nombre
    FROM institucion_producto ip
    JOIN producto p ON p.id = ip.producto_id
    WHERE ip.producto_id = ?
    AND ip.institucion_id = ?
    LIMIT 1
  `,
    [producto_id, institucion_id],
  );

  if (!producto) return null;

  const tasa = 0.025;

  const pago = (monto * tasa) / (1 - Math.pow(1 + tasa, -plazo));

  let saldo = monto;
  const tabla = [];

  for (let i = 1; i <= plazo; i++) {
    const interes = saldo * tasa;
    const capital = pago - interes;
    const saldoFinal = saldo - capital;

    tabla.push({
      periodo: i,
      saldo_inicial: saldo,
      interes,
      capital,
      pago,
      saldo_final: saldoFinal,
    });

    saldo = saldoFinal;
  }

  return {
    producto: producto.nombre,
    monto,
    plazo,
    tasa: tasa * 100,
    pago,
    tabla,
  };
};
