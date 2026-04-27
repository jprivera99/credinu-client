"use client";

import { useEffect } from "react";

interface Props {
  onFinish: () => void;
}

export const SuccessPasswordModal = ({ onFinish }: Props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="privacy-modal-backdrop">
      <div className="privacy-modal" style={{ textAlign: "center" }}>
        <h2 style={{ color: "#0D47A1" }}>Contraseña actualizada</h2>
        <p>Tu contraseña se cambió correctamente</p>
        <p>Serás redirigido al login...</p>
      </div>
    </div>
  );
};
