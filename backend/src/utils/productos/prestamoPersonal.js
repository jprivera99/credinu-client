// utils/productos/prestamoPersonal.js

import { amortizacionNormal }
from "../amortizacion/amortizacionNormal.js";

export const calcularPrestamoPersonal = (
  producto,
  data,
) => {

  const tasaIVA = 0.16;

  const monto =
    Number(data.monto);

  const ingreso =
    Number(data.ingreso);

  const capacidadPago =
    ingreso * 0.3;

  const tasa =
    Number(producto.tasa || 0) / 100;

  const plazo =
    Number(
      producto.plazo_max || 12,
    );

  const info = {

    monto,

    tasa_iva: tasaIVA,

    tasa_ordinaria: tasa,

    periodicidad:
      String(
        producto.periodicidad,
      ).toLowerCase(),

    duracion: plazo,

    plazo,

    fecha_inicio:
      new Date()
        .toISOString()
        .slice(0, 10),

    forma_pago: "normal",
  };

  const detalle =
    amortizacionNormal(info);

  return {

    producto_id:
      producto.producto_id,

    nombre:
      producto.nombre,

    monto_aprobado:
      Number(
        monto.toFixed(2),
      ),

    capacidad_pago:
      Number(
        capacidadPago.toFixed(2),
      ),

    plazo,

    periodicidad:
      producto.periodicidad,

    detalle,
  };
};