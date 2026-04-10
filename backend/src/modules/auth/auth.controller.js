import {
    loginService,
    getMeService,
    changePasswordService,
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
        const data = await changePasswordService(
            req.user.id,
            currentPassword,
            newPassword
        );
        return ok(res, data, "Password actualizado");
    } catch (error) {
        return next(error);
    }
};