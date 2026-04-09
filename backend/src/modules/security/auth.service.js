import { pool } from "../../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginService = async (email, password) => {

    const [rows] = await pool.query(
        "SELECT id, nombre, email, password, tipo FROM sis_usuarios WHERE usuario = ? LIMIT 1",
        [email]
    );

    if (rows.length === 0) {
        throw new Error("Usuario no existe");
    }

    const user = rows[0];

    // Validar password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        throw new Error("Credenciales incorrectas");
    }

    // Generar token
    const token = jwt.sign(
        {
            id: user.id,
            tipo: user.tipo
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
    );

    return {
        token,
        user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email
        }
    };
};