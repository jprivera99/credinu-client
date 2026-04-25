import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/appError.js";

const CLIENTE_PROFILE_IDS = [2, 4];

const isBcryptHash = (hash = "") => {
  return /^\$2[aby]\$\d{2}\$/.test(hash);
};

const md5 = (value) => {
  return crypto.createHash("md5").update(value).digest("hex");
};

const verifyPassword = async (plainPassword, storedHash) => {
  if (!storedHash) return { valid: false, needsUpgrade: false };

  const password = String(plainPassword).trim();

  if (isBcryptHash(storedHash)) {
    const valid = await bcrypt.compare(password, storedHash);
    return { valid, needsUpgrade: false };
  }

  const validLegacy = md5(password) === String(storedHash).toLowerCase();

  return { valid: validLegacy, needsUpgrade: validLegacy };
};

const buildToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      perfil_id: user.perfil_id,
      cliente_id: user.cliente_id,
      usuario: user.usuario,
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
    "SELECT id, nombre, usuario, email, password, perfil_id, cliente_id FROM sis_usuario WHERE usuario = ? LIMIT 1",
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

  return {
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      email: user.email,
      perfil_id: user.perfil_id,
      cliente_id: user.cliente_id,
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

export const changePasswordService = async ({
  token,
  tempPass,
  newPassword,
}) => {
  // 1. Buscar preregistro
  const [rows] = await pool.query(
    `SELECT * FROM pre_registro WHERE token = ? AND token_expiry > NOW() LIMIT 1`,
    [token],
  );

  if (rows.length === 0) {
    throw new Error("Token inválido o expirado");
  }

  const preregistro = rows[0];

  // 2. Obtener usuario
  const [userRows] = await pool.query(
    `SELECT * FROM sis_usuario WHERE preregistro_id = ? LIMIT 1`,
    [preregistro.id],
  );

  if (userRows.length === 0) {
    throw new Error("Usuario no encontrado");
  }

  const user = userRows[0];

  // 3. Validar contraseña temporal (igual que PHP)
  if (user.password !== tempPass) {
    throw new Error("Contraseña temporal inválida");
  }

  // 4. Actualizar contraseña
  await pool.query(
    `UPDATE sis_usuario 
     SET password = ?, reestablecer = 0 
     WHERE id = ?`,
    [newPassword, user.id],
  );

  return true;
};
