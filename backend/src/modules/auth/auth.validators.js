import { body } from "express-validator";

export const loginValidator = [
    body("usuario")
    .trim()
    .notEmpty()
    .withMessage("Usuario requerido"),
    body("password")
    .notEmpty()
    .withMessage("Password requerido")
];

export const changePasswordValidator = [
    body("currentPassword")
    .notEmpty()
    .withMessage("Password actual requerido"),
    body("newPassword")
    .isLength({ min: 8})
    .withMessage("El nuevo password debe tener al menos 8 caracteres")
    .matches(/(?=.*\d)(?=.*[^A-Za-z0-9])/)
    .withMessage("La nueva contraseña debe incluir al menos un numero y un signo")
];

export const changePasswordRecoveryValidator = [
    body("token")
    .notEmpty()
    .withMessage("Token requerido"),
    body("newPassword")
    .isLength({ min: 8})
    .withMessage("El nuevo password debe tener al menos 8 caracteres")
    .matches(/(?=.*\d)(?=.*[^A-Za-z0-9])/)
    .withMessage("La nueva contraseña debe incluir al menos un numero y un signo")
];

export const sendRecoverPasswordValidator = [
    body("correo")
    .trim()
    .notEmpty()
    .withMessage("Correo requerido")
    .isEmail()
    .withMessage("Correo invalido")
];