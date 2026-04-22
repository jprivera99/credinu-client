"use client";

import { useEffect } from "react";

interface SelectChannelModalProps {
  onClose: () => void;
  onSelect: (method: "SMS" | "WHATSAPP") => void;
}

export function SelectChannelModal({
  onClose,
  onSelect
}: SelectChannelModalProps) {

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div
        className="privacy-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="privacy-modal-title">
          ¿Cómo deseas recibir tu código?
        </h3>

        <div className="privacy-modal-content">
          <p>Selecciona el método de verificación:</p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            type="button"
            className="privacy-modal-close"
            onClick={() => onSelect("SMS")}
          >
            SMS
          </button>

          <button
            type="button"
            className="privacy-modal-close"
            onClick={() => onSelect("WHATSAPP")}
          >
            WhatsApp
          </button>
        </div>

        <button
          type="button"
          className="privacy-modal-close"
          onClick={onClose}
          style={{ marginTop: "10px" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}