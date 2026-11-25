// src/modules/mail/solicitud.notificaciones.js
// Correos que el sistema actual envía al enviar una solicitud (cte/Solicitud::enviarDocumentos):
//  - al promotor de la institución (perfil 2) con los datos del cliente y las condiciones
//  - al cliente con el resumen de su solicitud (si no la capturó un OBEX)

import { pool } from "../../config/db.js";
import { sendEmail } from "./mail.service.js";
import { contarPagos } from "../../utils/cotizador/cotizador.js";
import { numberFormat } from "../../utils/cotizador/php.js";

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const PERIODO = {
  semanal: ["semanales", "semanas"],
  catorcenal: ["catorcenales", "catorcenas"],
  quincenal: ["quincenales", "quincenas"],
  mensual: ["mensuales", "meses"],
};

const logo = () => `${process.env.FRONT_URL || ""}/images/credinu.png`;

const bloqueCondiciones = (s) => {
  let amort = {};
  try {
    amort = JSON.parse(s.amortizacion || "{}");
  } catch {
    /* sin tabla */
  }
  const pagos = contarPagos(amort.amortizacion || {});
  const [period, plazo] = PERIODO[String(s.periodicidad || "").toLowerCase()] || ["", ""];
  return `
    <div style="background:#E0F7FA;padding:12px;font-size:14px;text-align:justify;">
      Monto del Crédito: <u><b>$&nbsp;${numberFormat(s.monto_credito, 2)}</b></u>
      <br>A un plazo de: <u><b>${esc(s.plazo_meses)} ${plazo}.</b></u>
      <br>Que se pagarán mediante: <u><b>${esc(s.total_pagos)} pagos ${period}.</b></u>
      <br>Monto(s) de (los) pago(s) periódico(s):<br>
      ${pagos.map((p) => `<b>${p.veces}</b> pago(s) de <b>$&nbsp;${numberFormat(p.valor, 2)}</b><br>`).join("")}
    </div>`;
};

const tablaCliente = (c, institucion, telefono) => `
  <table style="text-align:center;width:90%;border-collapse:collapse;">
    <thead><tr style="background-color:#236EB0;color:#FFFFFF;">
      <th>Nombre:</th><th>RFC:</th><th>Empresa:</th><th>Correo:</th><th>Teléfono:</th>
    </tr></thead>
    <tr>
      <td>${esc(`${c.nombre} ${c.apellido_paterno}`)}</td><td>${esc(c.rfc)}</td><td>${esc(institucion)}</td>
      <td>${esc(c.email)}</td><td>${esc(telefono)}</td>
    </tr>
  </table>`;

const pie = `<p><b>Por favor, no respondas a este mensaje, ha sido enviado de forma automática. Si deseas ponerte en contacto con nosotros escríbenos a <a href="mailto:info@credinu.mx">info@credinu.mx</a></b></p>`;

export const enviarCorreosSolicitudEnviada = async (solicitudId, usuarioId) => {
  try {
    const [[s]] = await pool.query("SELECT * FROM solicitud WHERE id = ? LIMIT 1", [solicitudId]);
    if (!s) return;
    const [[c]] = await pool.query("SELECT * FROM cliente WHERE id = ? LIMIT 1", [s.cliente_id]);
    const [[inst]] = await pool.query("SELECT nombre FROM institucion WHERE id = ? LIMIT 1", [c?.institucion_id]);
    const [[usr]] = await pool.query("SELECT telefono_movil FROM sis_usuario WHERE id = ? LIMIT 1", [usuarioId]);
    const [[prod]] = await pool.query("SELECT nombre FROM producto WHERE id = ? LIMIT 1", [s.tipo_credito]);
    const [promotores] = await pool.query(
      `SELECT su.email FROM institucion_usuario iu
         INNER JOIN sis_usuario su ON iu.usuario_id = su.id
        WHERE su.email IS NOT NULL AND su.perfil_id IN (2) AND iu.institucion_id = ? AND su.borrado <> 1`,
      [c?.institucion_id || 0],
    );

    const nombreProducto = prod?.nombre || "";
    const telefono = usr?.telefono_movil || c?.telefono_movil || "";
    const nombreCliente = `${c?.nombre || ""} ${c?.apellido_paterno || ""} ${c?.apellido_materno || ""}`.trim();

    const destinos = promotores.map((p) => p.email).filter(Boolean);
    if (destinos.length) {
      await sendEmail({
        to: destinos.join(","),
        subject: `Alta Solicitud No.${s.id}-${nombreCliente}`,
        html: `
          <div style="width:80%;font-family:Arial,sans-serif;">
            <div style="text-align:center"><img src="${logo()}" alt="CrediNü" style="max-width:100px;max-height:30px;"></div>
            <p>Estimado Ejecutivo Onboarding:<br>Acaba de ser emitida la <b>Solicitud de Crédito No. ${s.id}</b> con los siguientes datos:</p>
            ${tablaCliente(c || {}, inst?.nombre, telefono)}
            <p>El cliente ha solicitado un crédito <b>${esc(nombreProducto)}</b> con las siguientes condiciones:</p>
            ${bloqueCondiciones(s)}
            <div style="font-size:14px;text-align:justify;padding:8px 0;">
              <b>En el portal se encuentra la documentación personal del cliente y le solicitamos:</b>
              <ol>
                <li>Revise la documentación escaneada.</li>
                <li>Genere la Autorización de Buró y envíela para firma.</li>
                <li>Elabore la propuesta final del préstamo de acuerdo a la documentación recibida.</li>
                <li>Requisite los formatos de crédito e integre el expediente.</li>
                <li>Obtenga el visto bueno de la Mesa de Análisis.</li>
                <li>Envíe la documentación para firma del Cliente.</li>
              </ol>
              Agradecemos su atención.
            </div>
            ${pie}
          </div>`,
      });
    }

    if (Number(s.obex) !== 1 && c?.email) {
      await sendEmail({
        to: c.email,
        subject: `Nueva Solicitud de Crédito No.${s.id}`,
        html: `
          <div style="width:80%;font-family:Arial,sans-serif;">
            <div style="text-align:center"><img src="${logo()}" alt="CrediNü" style="max-width:100px;max-height:30px;"></div>
            <p>Estimado Cliente:<br>La solicitud de tu crédito es la número <b>${s.id}</b>, tus datos personales son:</p>
            ${tablaCliente(c, inst?.nombre, telefono)}
            <p>Solicitaste el crédito de: <b>${esc(nombreProducto)}</b> con las siguientes condiciones:</p>
            ${bloqueCondiciones(s)}
            <p style="color:#011D36;text-align:justify;">
              En breve recibirás un correo indicando el estatus de tu solicitud y los pasos a seguir; también puedes
              revisar el proceso de tu préstamo ingresando a la opción del menú <b>Solicitudes de Crédito</b>.
              Te recordamos que el trámite de tu préstamo es gratuito.
            </p>
            ${pie}
          </div>`,
      });
    }
  } catch (error) {
    // Igual que en el sistema actual, un correo fallido no detiene el envío de la solicitud.
    console.error("[correo solicitud] no se pudo enviar:", error.message);
  }
};
