import { pool } from "../../config/db.js";
import crypto from "crypto";
import { sendToRem, sendSMSRem, validateSMSRem } from "../rem/rem.service.js";


// PRE REGISTER (USANDO TRIGGER)
export const preRegisterService = async (data) => {

    const {
        correo,
        telefono,
        nombre,
        apellido_paterno,
        apellido_materno,
        rfc,
        curp,
        institucion,
        account_id,
        fecha_nacimiento,
        nacimiento_estado,
        nacimiento_entidad_federativa,
        genero
    } = data;


    // 1. VALIDACIONES BÁSICAS

    if (!correo) throw new Error("Correo requerido");
    if (!telefono) throw new Error("Teléfono requerido");


    // 2. VALIDAR CORREO

    const [correoRows] = await pool.query(
        `SELECT id FROM sis_usuario WHERE usuario = ? LIMIT 1`,
        [correo]
    );

    if (correoRows.length > 0) {
        throw new Error("Correo ya registrado");
    }


    // 3. VALIDAR TELÉFONO

    const [telefonoRows] = await pool.query(
        `SELECT id FROM cliente WHERE telefono_movil = ? LIMIT 1`,
        [telefono]
    );

    if (telefonoRows.length > 0) {
        throw new Error("Teléfono ya registrado");
    }


    // 4. GENERAR PASSWORD Y TOKEN

    const passwordTemp = generarPasswordTemporal();
    const token = generarToken();


    // 5. INSERT PRE_REGISTRO (DISPARA TRIGGER)

    const [preResult] = await pool.query(
        `INSERT INTO pre_registro (
            correo,
            telefono,
            nombre,
            apellido_paterno,
            apellido_materno,
            rfc,
            curp,
            institucion,
            account_id,
            nacimiento_fecha,
            nacimiento_estado,
            nacimiento_entidad_federativa,
            genero,
            token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            correo,
            telefono,
            nombre,
            apellido_paterno,
            apellido_materno,
            rfc,
            curp,
            institucion,
            account_id,
            fecha_nacimiento,
            nacimiento_estado,
            nacimiento_entidad_federativa,
            genero,
            token
        ]
    );

    const preregistroId = preResult.insertId;


    // 6. OBTENER USUARIO GENERADO POR TRIGGER

    const [userRows] = await pool.query(
        `SELECT id, cliente_id 
         FROM sis_usuario 
         WHERE preregistro_id = ? 
         LIMIT 1`,
        [preregistroId]
    );

    if (userRows.length === 0) {
        throw new Error("El trigger no generó el usuario");
    }

    const userId = userRows[0].id;
    const clienteId = userRows[0].cliente_id;


    // 7. ACTUALIZAR CLIENTE

    await pool.query(
        `UPDATE cliente 
         SET telefono_movil = ?, nombre = ?, rfc = ?, curp = ?
         WHERE id = ?`,
        [telefono, nombre, rfc, curp, clienteId]
    );


    // 8. ENVIAR A REM

    await sendToRem(clienteId);


    // 9. ENVIAR CORREO

    enviarCorreo(correo, passwordTemp, token);

    return ok(res, data, "Registro exitoso");
};

// PASSWORD TEMPORAL
const generarPasswordTemporal = () => {
    return Math.random().toString(36).slice(-8);
};

// TOKEN
const generarToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

// SIMULACIÓN DE EMAIL
const enviarCorreo = (correo, passwordTemp, token) => {
    console.log(`
    ====== EMAIL ======
    Correo: ${correo}
    Password temporal: ${passwordTemp}
    Link: http://localhost:3000/activar?token=${token}
    ====================
    `);
};

export const validateRegisterService = async ({ correo, telefono, rfc, curp }) => {

    // VALIDAR CORREO
    const [correoRows] = await pool.query(
        `SELECT id FROM sis_usuario WHERE email = ? LIMIT 1`,
        [correo]
    );

    if (correoRows.length > 0) {
        throw new Error("Correo ya registrado");
    }

    // VALIDAR TELÉFONO
    const [telefonoRows] = await pool.query(
        `SELECT id FROM cliente WHERE telefono_movil = ? LIMIT 1`,
        [telefono]
    );

    if (telefonoRows.length > 0) {
        throw new Error("Teléfono ya registrado");
    }

    // VALIDAR RFC (YA EXISTE)
    const [rfcRows] = await pool.query(
        `SELECT id FROM cliente WHERE rfc = ? LIMIT 1`,
        [rfc]
    );

    if (rfcRows.length > 0) {
        throw new Error("RFC ya registrado");
    }

    // VALIDAR CURP (YA EXISTE)
    const [curpRows] = await pool.query(
        `SELECT id FROM cliente WHERE curp = ? LIMIT 1`,
        [curp]
    );

    if (curpRows.length > 0) {
        throw new Error("CURP ya registrado");
    }

    // VALIDAR FORMATO RFC
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
    if (!rfcRegex.test(rfc)) {
        throw new Error("RFC inválido");
    }

    // VALIDAR FORMATO CURP
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
    if (!curpRegex.test(curp)) {
        throw new Error("CURP inválido");
    }

    return {
        valid: true
    };
};

//---------------------------------------------------------------

// VALIDAR CORREO
export const validateEmailService = async (correo) => {

    const [rows] = await pool.query(
        `SELECT id FROM sis_usuario WHERE email = ? LIMIT 1`,
        [correo]
    );

    return {
        exists: rows.length > 0
    };
};

// VALIDAR TELÉFONO
export const validatePhoneService = async (telefono) => {

    const [rows] = await pool.query(
        `SELECT id FROM cliente WHERE telefono_movil = ? LIMIT 1`,
        [telefono]
    );

    return {
        exists: rows.length > 0
    };
};

// VALIDAR SMS (MOCK)
export const validateSMSService = async ({ telefono, codigo }) => {

    if (codigo !== "123456") {
        throw new Error("Código inválido");
    }

    return {
        success: true
    };
};

// UTIL
const generarPassword = () => {
    return Math.random().toString(36).slice(-8);
};

// ENVIAR CÓDIGO
export const sendCodeService = async ({ telefono, canal }) => {

    if (!telefono) throw new Error("Teléfono requerido");
    if (!canal) throw new Error("Canal requerido");

    if (!["sms", "whatsapp"].includes(canal)) {
        throw new Error("Canal inválido");
    }

    // llamada a REM
    const response = await sendSMSRem({
        telefono,
        canal
    });

    return response;
};

// VALIDAR CÓDIGO
export const validateCodeService = async ({ telefono, codigo }) => {

    if (!telefono) throw new Error("Teléfono requerido");
    if (!codigo) throw new Error("Código requerido");

    const response = await validateSMSRem({
        telefono,
        codigo
    });

    if (!response.valid) {
        throw new Error("Código inválido");
    }

    return {
        valid: true
    };
};