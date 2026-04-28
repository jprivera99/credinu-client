import { cotizarService } from "./quotation.service.js";

export const cotizar = async (req, res) => {
  try {
    const { monto, ingreso, producto_id } = req.body;
    const institucion_id = req.user.institucion_id;

    if (!monto || !ingreso) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const result = await cotizarService({
      monto,
      ingreso,
      producto_id,
      institucion_id,
    });

    res.json(result);
  } catch (error) {
    console.error("ERROR COTIZAR:", error);
    res.status(500).json({ message: "Error al cotizar" });
  }
};