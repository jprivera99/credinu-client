import { ok } from "../../utils/responses.js";
import {
    preRegisterService,
    validateEmailService,
    validatePhoneService,
    validateSMSService,
    sendCodeService,
    validateCodeService,
    validateRegisterService,
    calcularRFCService 
} from "./register.service.js";

export const preRegister = async (req, res, next) => {
    try {
        const data = await preRegisterService(req.body);
        return ok(res, data, "Registro exitoso");
    } catch (error) {
        return next(error);
    }
};

export const validateEmail = async (req, res, next) => {
    try {
        const { correo } = req.query;
        const data = await validateEmailService(correo);
        return ok(res, data);
    } catch (error) {
        return next(error);
    }
};

export const validatePhone = async (req, res, next) => {
    try {
        const { telefono } = req.query;
        const data = await validatePhoneService(telefono);
        return ok(res, data);
    } catch (error) {
        return next(error);
    }
};

export const validateSMS = async (req, res, next) => {
    try {
        const data = await validateSMSService(req.body);
        return ok(res, data, "Código validado");
    } catch (error) {
        return next(error);
    }
};

// ENVIAR CÓDIGO
export const sendCode = async (req, res, next) => {
    try {
        const data = await sendCodeService(req.body);
        return ok(res, data, "Código enviado");
    } catch (error) {
        return next(error);
    }
};

// VALIDAR CÓDIGO
export const validateCode = async (req, res, next) => {
    try {
        const data = await validateCodeService(req.body);
        return ok(res, data, "Código validado");
    } catch (error) {
        return next(error);
    }
};

// VALIDAR REGISTRO
export const validateRegister = async (req, res, next) => {
    try {
        const data = await validateRegisterService(req.body);
        return ok(res, data, "Datos válidos");
    } catch (error) {
        return next(error);
    }
};

export const calcularRFCController = async (req, res) => {
  try {
    const { nombre, apPaterno, apMaterno, fechaNacimiento } = req.body;

    if (!nombre || !apPaterno || !apMaterno || !fechaNacimiento) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const rfc = calcularRFCService(
      nombre,
      apPaterno,
      apMaterno,
      fechaNacimiento
    );

    return res.json({ rfc });

  } catch (error) {
    return res.status(500).json({ error: "Error al calcular RFC" });
  }
};