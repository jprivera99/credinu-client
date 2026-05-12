import {
    loginService,
    getMeService,
  changePasswordByUserService,
    changePasswordService,
    SendEmailRecoveryPassword
} from "./auth.service.js";
import { ok } from "../../utils/responses.js";

export const login = async (req, res, next) => {
    try {
        const { usuario, password } = req.body;
        const data = await loginService(usuario, password);
        return ok(res, data, "Login correcto");
    } catch (error) {
        return next(error);
    }
};

export const me = async (req, res, next) => {
    try {
        const data = await getMeService(req.user.id);
        return ok(res, data, "Perfil obtenido");
    } catch (error) {
        return next(error);
    }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const data = await changePasswordByUserService({
      userId: req.user.id,
      currentPassword,
      newPassword,
    });

    return ok(res, data, "Contraseña actualizada");
  } catch (error) {
    next(error);
  }
};

export const changePasswordRecovery = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const data = await changePasswordService({
      token,
      newPassword,
    });

    return ok(res, data, "Contraseña actualizada");
  } catch (error) {
    next(error);
  }
};

export const sendRecoverPassword = async (req, res, next) => {
  try {
    const { correo } = req.body;
    
    await SendEmailRecoveryPassword({
      correo: correo,
    });

    return ok(res, null, "Correo de recuperación enviado");
    } catch (error) {
        next(error);
    }
};