// utils/productos/calcularSalarioDemanda.js

import {
  amortizacionNormal,
} from "../amortizacion/amortizacionNormal.js";

export const calcularSalarioDemanda = (
  producto,
  data,
) => {

  const tasaIVA = 0.16;

  const ingreso =
    Number(data.ingreso);

  let monto =
    Number(data.monto);

  // MAXIMO 3 INGRESOS
  const montoMaximo =
    ingreso * 3;

  if (monto > montoMaximo) {
    monto = montoMaximo;
  }

  const capacidadPago =
    ingreso * 0.35;

  const capacidadMensual =
    capacidadPago * 2;

  const tasa =
    Number(
      producto.tasa || 0,
    ) / 100;

  const plazo =
    Number(
      producto.plazo_max || 18,
    );

  const info = {

    monto,

    tasa_iva:
      tasaIVA,

    tasa_ordinaria:
      tasa,

    periodicidad:
      String(
        producto.periodicidad || "",
      ).toLowerCase(),

    duracion:
      plazo,

    plazo,

    fecha_inicio:
      new Date()
        .toISOString()
        .slice(0, 10),

    forma_pago:
      "normal",
  };

  const detalle =
    amortizacionNormal(
      info,
    );

  let pagoPeriodico = 0;

  if (
    detalle.payments &&
    detalle.payments.length > 0
  ) {

    pagoPeriodico =
      detalle.payments[0].paid;
  }

  return {

    producto_id:
      producto.producto_id,

    nombre:
      producto.nombre,

    monto_aprobado:
      Number(
        monto.toFixed(2),
      ),

    plazo,

    pago_periodico:
      Number(
        pagoPeriodico.toFixed(2),
      ),

    capacidad_pago:
      Number(
        capacidadPago.toFixed(2),
      ),

    capacidad_mensual:
      Number(
        capacidadMensual.toFixed(2),
      ),

    detalle,

    periodicidad:
      String(
        producto.periodicidad || "",
      ).toLowerCase(),
  };
};