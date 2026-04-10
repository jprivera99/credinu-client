import { pool } from "../../config/db.js";
import { ok } from "../../utils/responses.js";

export const getMe = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            "SELECT  c.id, c.nombre, c.apellido_paterno, c.apellido_materno, c.rfc, c.curp, c.email, c.telefono_movil, c.domicilio_cp, c.domicilio_calle, c.domicilio_calle_numext AS domicilio_numero    FROM sis_usuario su    INNER JOIN cliente c ON c.id = su.cliente_id    WHERE su.id = ? LIMIT 1",
            [req.user.id]
        );

        return ok(res, rows[0] || null, "Perfil cliente obtenido");
    } catch (error) {
        return next(error);
    }
};

export const updateMe = async (req, res, next) => {
    try {
        const {
            email,
            telefono_movil,
            domicilio_cp,
            domicilio_calle,
            domicilio_numero,
        } = req.body;

        await pool.query(
            "UPDATE cliente c    INNER JOIN sis_usuario su ON su.cliente_id = c.id    SET      c.email = ?, c.telefono_movil = ?, c.domicilio_cp = ?, c.domicilio_calle = ?, c.domicilio_calle_numext = ? WHERE su.id = ?",
            [
                email ?? null,
                telefono_movil ?? null,
                domicilio_cp ?? null,
                domicilio_calle ?? null,
                domicilio_numero ?? null,
                req.user.id,
            ]
        );

        return ok(res, { updated: true }, "Perfil actualizado");
    } catch (error) {
        return next(error);
    }
};

