export const preRegistroTemplate = ({
  nombre,
  correo,
  pass,
  token,
}) => {
  const link = `${process.env.FRONT_URL}/cambiar-password?key=${token}&key2=${pass}`;

  return `
    <div style="text-align:center; width:80%;">
        <h2>BIENVENIDO(A) ${nombre} A:</h2>

        <img src="${process.env.FRONT_URL}/images/credinu.png" 
             style="max-width: 200px; max-height: 60px;" />

        <p>
          A partir de ahora tu USUARIO es: 
          <b>${correo}</b>
        </p>

        <p>
          Tu contraseña temporal es: <b>${pass}</b>
        </p>

        <p>
          Debes cambiar tu contraseña dando clic abajo
        </p>

        <a href="${link}">
          <button style="
            font-size: 16px; 
            background-color: #008CBA;
            color: white;
            padding: 15px 32px;
            border: none;
            border-radius: 5px;">
            Cambiar contraseña
          </button>
        </a>

        <p style="margin-top:20px;">
          No respondas este correo
        </p>
    </div>
  `;
};