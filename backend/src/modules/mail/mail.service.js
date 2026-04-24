import nodemailer from "nodemailer";
import { preRegistroTemplate } from "./templates/preRegistro.template.js";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  return await transporter.sendMail({
    from: `"CrediNú" <${process.env.MAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

export const enviarCorreoPreRegistroCliente = async ({
  correo,
  token,
  nombre,
  pass,
}) => {
  const html = preRegistroTemplate({
    nombre,
    correo,
    pass,
    token,
  });

  return await sendEmail({
    to: correo,
    subject: "Validación Correo CrediNú",
    html,
  });
};