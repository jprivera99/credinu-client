import { ok, fail } from "../../utils/responses.js";
import { sendCodeService } from "./rem.service.js";

export const sendCode = async (req, res, next) => {
  try {
    const canal = req.params.canal || "SMS";
    const { phone, nombre_cliente, retry } = req.body;

    if (!phone || phone.length !== 10) {
      return fail(res, "Teléfono inválido", 400);
    }

    const data = await sendCodeService({
      canal,
      phone,
      nombre_cliente,
      retry,
    });

    ok(res, data, "Código enviado");
  } catch (error) {
    next(error);
  }
};