//src/modules/rem/rem.controller.js
import { ok, fail } from "../../utils/responses.js";
import { sendCodeService, validateCodeService } from "./rem.service.js";

export const sendCode = async (req, res, next) => {
  try {
    const { canal = "SMS", phone, nombre_cliente, retry } = req.body;

    console.log("API KEY:", process.env.REM_APIKEY);
    console.log("API URL:", process.env.REM_URL);

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

export const validateCode = async (req, res, next) => {
  try {
    const { phone, code, canal } = req.body;

    if (!phone || phone.length !== 10) {
      return fail(res, "Teléfono inválido", 400);
    }

    if (!code) {
      return fail(res, "Código requerido", 400);
    }

    const data = await validateCodeService({
      phone,
      code,
      canal,
    });

    ok(res, data, "Código validado");
  } catch (error) {
    next(error);
  }
};