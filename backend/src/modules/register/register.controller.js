import e from "express";
import { ok, fail } from "../../utils/responses.js";
import { calcularRFCUtils } from "../../utils/rfc.js";
import { calcularCURPUtils } from "../../utils/curp.js";
import {
  preRegisterService,
  validateSMSService,
  sendCodeService,
  validateCodeService,
  validateRegisterService,
} from "./register.service.js";

export const preRegister = async (req, res) => {
  try {
    const data = await preRegisterService(req.body);
    return ok(res, data, "Registro exitoso");
  } catch (error) {
    console.error("ERROR PRE-REGISTER:", error);
    return fail(res, error.message || "Error interno", 500);
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
export const validateRegister = async (req, res) => {
  try {
    const data = await validateRegisterService(req.body);
    return ok(res, data, "Validación correcta");
  } catch (error) {
    return fail(res, error.message, 400);
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

    const rfc = calcularRFCUtils(
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

    const curp = calcularCURPUtils(
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
