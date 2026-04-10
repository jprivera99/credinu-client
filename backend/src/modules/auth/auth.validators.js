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
];