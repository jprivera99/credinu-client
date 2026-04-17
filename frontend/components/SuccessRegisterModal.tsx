"use client";

import { useEffect } from "react";

export const SuccessRegisterModal = ({ onFinish }: any) => {

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
        <h2 style={{ color: "#0D47A1" }}>¡Felicidades!</h2>
        <p>Tu código ha sido validado correctamente</p>
        <p>Estamos finalizando tu registro...</p>
      </div>
    </div>
  );
};