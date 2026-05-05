// services/quotation.service.js

import { getProductByInstitutionQuotation } from "../products/products.service.js";
import { calcularAdelantoNomina } from "../../utils/cotizador.js";

export const cotizarService = async ({
  monto,
  ingreso,
  institucion_id,
}) => {
  const productos = await getProductByInstitutionQuotation(institucion_id);

  const resultados = [];

  if (productos[1]) {
    const adelanto = calcularAdelantoNomina(productos[1], {
      monto,
      ingreso,
    });

    resultados.push({
      producto_id: 1,
      nombre: productos[1].nombre,
      monto_aprobado: adelanto.monto,
      plazo: adelanto.numPagos,
      pago_semanal: adelanto.pago,
      detalle: adelanto.amortizacion,
    });
  }

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
    [producto_id, institucion_id]
  );

  if (!producto) return null;

  const tasa = 0.025;

  const pago =
    (monto * tasa) / (1 - Math.pow(1 + tasa, -plazo));

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