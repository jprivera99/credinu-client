import { pool } from "../../config/db.js";

export const getPerfil = async (req, res) => {
    try {

        const userId = req.user.id;

        const [rows] = await pool.query(
            "SELECT id, nombre, usuario, email FROM sis_usuario WHERE id = ?",
            [userId]
        );

        res.json(rows[0]);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};