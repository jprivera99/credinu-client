"use client";

import { useEffect } from "react";

interface ConfirmDataModalProps {
  rfc: string;
  curp: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDataModal({
  rfc,
  curp,
  onClose,
  onConfirm
}: ConfirmDataModalProps) {

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
          ¿Tus datos son correctos?
        </h3>

        <div className="privacy-modal-content">
          <p><strong>RFC:</strong> {rfc}</p>
          <p><strong>CURP:</strong> {curp}</p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            type="button"
            className="privacy-modal-close"
            onClick={onClose}
          >
            Editar
          </button>

          <button
            type="button"
            className="privacy-modal-close"
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}