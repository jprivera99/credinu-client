"use client";

import { useEffect } from "react";

interface Props {
  onFinish: () => void;
}

export default function RecoverSuccessModal({ onFinish }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="privacy-modal-backdrop">
      <div className="privacy-modal" style={{ textAlign: "center" }}>
        <h2 style={{ color: "#0D47A1" }}>Correo enviado</h2>
        <p>
          Si el correo existe, recibirás un enlace para restablecer tu
          contraseña.
        </p>
      </div>
    </div>
  );
}
