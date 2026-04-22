"use client";

import { useEffect, useState } from "react";

interface VerifyCodeModalProps {
  telefono: string;
  onVerify: (codigo: string) => void;
  onResend: () => void;
  error?: string;
}

export function VerifyCodeModal({
  telefono,
  onVerify,
  onResend
}: VerifyCodeModalProps) {

  const [codigo, setCodigo] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleInputChange = (e: any) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) {
      setCodigo(value);
    }
  };

  const handleValidate = () => {
    if (codigo.length !== 6) {
      alert("El código debe tener 6 dígitos");
      return;
    }

    onVerify(codigo);
  };

  const handleResend = () => {
    if (!canResend) return;

    setTimer(60);
    setCanResend(false);
    onResend();
  };

  return (
    <div className="privacy-modal-backdrop">
      <div className="privacy-modal">

        <h3 className="privacy-modal-title">
          Verifica tu código
        </h3>

        <div className="privacy-modal-content">
          <p>Ingresa el código enviado a:</p>
          <strong>{telefono}</strong>

          <input
            type="text"
            value={codigo}
            onChange={handleInputChange}
            maxLength={6}
            placeholder="------"
            style={{
              marginTop: "15px",
              fontSize: "20px",
              textAlign: "center",
              letterSpacing: "8px"
            }}
          />

          {/* ⏱️ Timer */}
          <p style={{ marginTop: "10px", fontSize: "12px" }}>
            {canResend
              ? "Puedes reenviar el código"
              : `Reenviar en ${timer}s`}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>

          {/* REENVIAR */}
          <button
            type="button"
            className="privacy-modal-close"
            onClick={handleResend}
            disabled={!canResend}
          >
            Reenviar
          </button>

          {/* VALIDAR */}
          <button
            type="button"
            className="privacy-modal-close"
            onClick={handleValidate}
          >
            Validar
          </button>

        </div>
      </div>
    </div>
  );
}