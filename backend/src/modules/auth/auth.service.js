import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/appError.js";
import { enviarCorreoRecuperacion } from "../../modules/mail/mail.service.js";

// 4 = PERFIL_SNET_CLIENTE. (2 es PROMOTOR en el sistema actual: no debe entrar al portal de clientes)
const CLIENTE_PROFILE_IDS = [4];

const isBcryptHash = (hash = "") => {
  return /^\$2[aby]\$\d{2}\$/.test(hash);
};

const md5 = (value) => {
  return crypto.createHash("md5").update(value).digest("hex");
};

export const verifyPassword = async (plainPassword, storedHash) => {
  if (!storedHash) return { valid: false, needsUpgrade: false };

  const password = String(plainPassword).trim();

  if (isBcryptHash(storedHash)) {
    const valid = await bcrypt.compare(password, storedHash);
    return { valid, needsUpgrade: false };
  }

  // El sistema actual guarda md5 de la contraseña tal cual (sin trim).
  const legacy = String(storedHash).toLowerCase();
  const validLegacy = md5(String(plainPassword)) === legacy || md5(password) === legacy;

  return { valid: validLegacy, needsUpgrade: validLegacy };
};

const buildToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      perfil_id: user.perfil_id,
      cliente_id: user.cliente_id,
      usuario: user.usuario,
      institucion_id: user.institucion_id,
    },
    env.jwtSecret,
    {
      expiresIn: "8h",
      issuer: "credinu",
    },
  );
};

export const loginService = async (usuario, password) => {
  const [rows] = await pool.query(
    "SELECT id, nombre, usuario, email, password, perfil_id, cliente_id, institucion_id FROM sis_usuario WHERE usuario = ? AND IFNULL(borrado,0) = 0 LIMIT 1",
    [usuario],
  );

  if (rows.length === 0) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const user = rows[0];

  if (!CLIENTE_PROFILE_IDS.includes(Number(user.perfil_id))) {
    throw new AppError("Usuario no autorizado para portal cliente", 403);
  }

  if (!user.cliente_id || Number(user.cliente_id) <= 0) {
    throw new AppError("Usuario sin cliente asociado", 403);
  }

  const passwordCheck = await verifyPassword(password, user.password);

  if (!passwordCheck.valid) {
    throw new AppError("Credenciales inválidas", 401);
  }

  if (passwordCheck.needsUpgrade) {
    const newHash = await bcrypt.hash(password.trim(), 10);

    await pool.query("UPDATE sis_usuario SET password = ? WHERE id = ?", [
      newHash,
      user.id,
    ]);
  }

  const token = buildToken(user);

  // Logging para prueba de autenticación
  console.log(`Usuario ${user.usuario} autenticado correctamente`);
  console.log(`Perfil ID: ${user.perfil_id}, Cliente ID: ${user.cliente_id}, Institución ID: ${user.institucion_id}`);

  return {
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      email: user.email,
      perfil_id: user.perfil_id,
      cliente_id: user.cliente_id,
      institucion_id: user.institucion_id,
    },
  };
};

export const getMeService = async (userId) => {
  const [rows] = await pool.query(
    "SELECT id, nombre, usuario, email, perfil_id, cliente_id FROM sis_usuario WHERE id = ? LIMIT 1",
    [userId],
  );

  if (rows.length === 0) {
    throw new AppError("Usuario no encontrado", 404);
  }

  return rows[0];
};

export const changePasswordByUserService = async ({ userId, currentPassword, newPassword }) => {
  const [rows] = await pool.query(
    "SELECT id, password FROM sis_usuario WHERE id = ? LIMIT 1",
    [userId],
  );

  if (rows.length === 0) {
    throw new AppError("Usuario no encontrado", 404);
  }

  const user = rows[0];

  const passwordCheck = await verifyPassword(currentPassword, user.password);

  if (!passwordCheck.valid) {
    throw new AppError("La contraseña actual no es correcta", 400);
  }

  const samePasswordCheck = await verifyPassword(newPassword, user.password);

  if (samePasswordCheck.valid) {
    throw new AppError("La nueva contraseña no puede ser igual a la actual", 400);
  }

  const newHash = await bcrypt.hash(String(newPassword).trim(), 10);

  await pool.query("UPDATE sis_usuario SET password = ? WHERE id = ?", [
    newHash,
    userId,
  ]);

  return { updated: true };
};

//Cambio de contraseña con token de recuperación
export const changePasswordService = async ({ token, newPassword }) => {
  // 1. Buscar preregistro
  const [rows] = await pool.query(
    `SELECT * FROM sis_usuario WHERE token = ? AND token_expiry > NOW() LIMIT 1`,
    [token],
  );

  if (rows.length === 0) {
    throw new Error("Token inválido o expirado");
  }

  const user = rows[0];

  const newHash = await bcrypt.hash(newPassword.trim(), 10);

  // 2. Actualizar contraseña
  await pool.query(
    `UPDATE sis_usuario 
     SET password = ?, reestablecer = 0 
     WHERE id = ?`,
    [newHash, user.id],
  );

  return true;
};

export const SendEmailRecoveryPassword = async ({ correo }) => {
  // 1. Buscar usuario
  const [rows] = await pool.query(
    `SELECT id, CONCAT(nombre, ' ', apellido_paterno, ' ', apellido_materno) AS nombre FROM sis_usuario WHERE usuario = ? LIMIT 1`,
    [correo],
  );
  if (rows.length === 0) {
    throw new Error("Correo no registrado");
  }

  const user = rows[0];

  // 2. Generar token y expiración
  const token = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  await pool.query(
    `UPDATE sis_usuario 
         SET token_expiry = ?, token = ?
         WHERE id = ?`,
    [tokenExpiry, token, user.id],
  );

  // 3. Envio de correo
  await enviarCorreoRecuperacion({
    correo,
    token,
    nombre: user.nombre,
  });

  return true;
};
