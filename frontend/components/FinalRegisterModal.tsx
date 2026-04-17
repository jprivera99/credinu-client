"use client";

import { useEffect } from "react";

export const FinalRegisterModal = ({ onFinish }: any) => {

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="privacy-modal-backdrop">
      <div
        className="privacy-modal"
        style={{ textAlign: "center" }}
      >
        <h2 style={{ color: "#0D47A1" }}>Registro completado</h2>

        <p>Tu cuenta ha sido creada correctamente</p>

        <p>
          Te hemos enviado un correo con tus credenciales y un enlace
          para iniciar sesión.
        </p>
      </div>
    </div>
  );
};