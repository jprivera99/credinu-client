import { loginService } from "./auth.service.js";

export const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email y password son requeridos"
            });
        }

        const data = await loginService(email, password);

        res.json(data);

    } catch (error) {
        res.status(401).json({
            message: error.message
        });
    }
};