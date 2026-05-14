//src/modules/quotation.controller.js

import { cotizarService, detalleService } from "./quotation.service.js";

export const cotizar = async (req, res) => {
  try {
    const { monto, ingreso } = req.body;
    const institucion_id = req.user.institucion_id;
    const cliente_id = req.user.cliente_id;

    if (!monto || !ingreso) {
      return res.status(400).json({
        success: false,
        message: "Datos incompletos",
      });
    }

    const result = await cotizarService({
      monto: Number(monto),
      ingreso: Number(ingreso),
      institucion_id,
      cliente_id,
    });

    return res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("ERROR COTIZAR:", error);

    return res.status(500).json({
      success: false,
      message: "Error al cotizar",
    });
  }
};

export const getDetalle = async (req, res) => {
  try {
    const { monto, plazo, id, ingreso } = req.body;
    const institucion_id = req.user.institucion_id;

    const result = await detalleService({
      monto,
      plazo,
      id,
      ingreso,
      institucion_id,
    });

    return res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("ERROR DETALLE:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error al obtener detalle",
    });
  }
};