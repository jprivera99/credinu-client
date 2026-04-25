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
  try {
    console.log("Configurando transporter...");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log("Enviando correo a:", to);

    const info = await transporter.sendMail({
      from: `"CrediNú" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Correo enviado:", info.messageId);

    return info;
  } catch (error) {
    console.error("Error enviando correo:", error);
    throw error;
  }
};

export const enviarCorreoPreRegistroCliente = async ({
  correo,
  token,
  nombre,
  pass,
}) => {
  console.log("Preparando correo para:", correo);

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
