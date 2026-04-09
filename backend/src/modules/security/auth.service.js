import { pool } from "../../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const loginService = async (usuario, password) => {

    const [rows] = await pool.query(
        "SELECT id, nombre, usuario, password, perfil_id, cliente_id FROM sis_usuario WHERE usuario = ? LIMIT 1",
        [usuario]
    );

    if (rows.length === 0) {
        throw new Error("Credenciales inválidas");
    }

    const user = rows[0];

    // Validar estatus (opcional)
    /* if (user.estatus && user.estatus !== 'ACTIVO') {
        throw new Error("Usuario inactivo");
    } */

    // Validar password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        throw new Error("Credenciales inválidas");
    }

    // Generar token
    const token = jwt.sign(
        {
            id: user.id,
            perfil_id: user.perfil_id,
            cliente_id: user.cliente_id,
            usuario: user.usuario
        },
        env.jwtSecret,
        { expiresIn: "8h" }
    );

    return {
        token,
        user: {
            id: user.id,
            nombre: user.nombre,
            usuario: user.usuario
        }
    };
};

export const registerService = async (data) => {

    const {
        usuario,
        password,
        nombre,
        apellido_paterno,
        apellido_materno,
        email
    } = data;

    // Validar si ya existe
    const [exist] = await pool.query(
        "SELECT id FROM sis_usuario WHERE usuario = ? OR email = ? LIMIT 1",
        [usuario, email]
    );

    if (exist.length > 0) {
        throw new Error("El usuario o correo ya existe");
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [result] = await pool.query(
        `INSERT INTO sis_usuario 
        (usuario, password, nombre, apellido_paterno, apellido_materno, email, perfil_id, fecha_registro)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            usuario,
            hashedPassword,
            nombre,
            apellido_paterno,
            apellido_materno,
            email,
            2
        ]
    );

    return {
        id: result.insertId,
        usuario,
        nombre
    };
};