"use client";

import { useState } from "react";
import { sendRecoverPasswordRequest } from "@/lib/api";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecoverPasswordModal({ onClose, onSuccess }: Props) {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setError("");

    if (!correo || !/^\S+@\S+\.\S+$/.test(correo)) {
      return setError("Correo inválido");
    }

    try {
      setLoading(true);

      await sendRecoverPasswordRequest({ correo });

      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al enviar correo");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div className="privacy-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="privacy-modal-title">Recuperar contraseña</h3>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div className="privacy-modal-content grid">
          <input
            type="email"
            placeholder="Ingresa tu correo"
            className="register-input register-span-2"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={handleSend} disabled={loading} className="privacy-modal-close">
            {loading ? "Enviando..." : "Enviar"}
          </button>
          <button onClick={onClose} className="privacy-modal-close">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
