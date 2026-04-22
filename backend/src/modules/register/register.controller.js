import e from "express";
import { ok } from "../../utils/responses.js";
import {
  preRegisterService,
  validateEmailService,
  validatePhoneService,
  validateRFCService,
  validateSMSService,
  sendCodeService,
  validateCodeService,
  validateRegisterService,
  calcularRFCService,
  calcularCURPService,
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
    const telefono = req.query.phone.replace(/\D/g, "");
    const data = await validatePhoneService(telefono);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const validateRFCController = async (req, res, next) => {
  try {
    const { rfc } = req.query;
    const data = await validateRFCService(rfc);
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

// CALCULAR RFC
export const calcularRFCController = async (req, res) => {
  try {
    const { nombre, apellido_paterno, apellido_materno, fecha_nacimiento } =
      req.body;

    if (
      !nombre ||
      !apellido_paterno ||
      !apellido_materno ||
      !fecha_nacimiento
    ) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const rfc = calcularRFCService(
      nombre,
      apellido_paterno,
      apellido_materno,
      fecha_nacimiento,
    );

    return res.json({ rfc });
  } catch (error) {
    return res.status(500).json({ error: "Error al calcular RFC" });
  }
};

// CALCULAR CURP
export const calcularCURPController = async (req, res) => {
  try {
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      fecha_nacimiento,
      sexo,
      estado_nacimiento,
    } = req.body;

    if (
      !nombre ||
      !apellido_paterno ||
      !apellido_materno ||
      !fecha_nacimiento ||
      !sexo ||
      !estado_nacimiento
    ) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const curp = calcularCURPService(
      nombre,
      apellido_paterno,
      apellido_materno,
      fecha_nacimiento,
      sexo,
      estado_nacimiento,
    );

    return res.json({ curp });
  } catch (error) {
    return res.status(500).json({ error: "Error al calcular CURP" });
  }
};
