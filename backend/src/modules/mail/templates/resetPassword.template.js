export const resetPasswordTemplate = ({
  nombre,
  correo,
  token,
}) => {
  const link = `${process.env.FRONT_URL}/change-password?token=${token}`;

  return `
    <div style="text-align:center; width:80%; margin:auto; font-family: Arial, sans-serif;">
        
        <h2 style="color:#0D47A1;">
          Recuperación de contraseña
        </h2>

        <img src="${process.env.FRONT_URL}/images/credinu.png" 
             style="max-width: 200px; max-height: 60px; margin-bottom:20px;" />

        <p>Hola <b>${nombre}</b>,</p>

        <p>
          Recibimos una solicitud para restablecer la contraseña de tu cuenta.
        </p>

        <p>
          Si realizaste esta solicitud, puedes crear una nueva contraseña dando clic en el siguiente botón:
        </p>

        <a href="${link}">
          <button style="
            font-size: 16px; 
            background-color: #0D47A1;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;">
            Restablecer contraseña
          </button>
        </a>

        <p style="margin-top:20px;">
          Este enlace es válido por <b>24 horas</b>.
        </p>

        <p style="margin-top:10px; font-size: 13px; color: #555;">
          Si tú no solicitaste este cambio, puedes ignorar este correo. Tu cuenta seguirá segura.
        </p>

        <hr style="margin: 30px 0;" />

        <p style="font-size: 12px; color: #999;">
          Este es un mensaje automático, por favor no respondas a este correo.
        </p>
    </div>
  `;
};