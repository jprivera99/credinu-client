import { loginService } from "./auth.service.js";
import { registerService } from "./auth.service.js";
import { validationResult } from "express-validator";

export const login = async (req, res) => {
    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const { usuario, password } = req.body;

        const data = await loginService(usuario, password);

        res.json(data);

    } catch (error) {
        res.status(401).json({
            message: error.message
        });
    }
};

export const register = async (req, res) => {
    try {

        const data = req.body;

        if (!data.usuario || !data.password || !data.nombre) {
            return res.status(400).json({
                message: "Datos incompletos"
            });
        }

        const user = await registerService(data);

        res.status(201).json({
            message: "Usuario registrado correctamente",
            user
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};