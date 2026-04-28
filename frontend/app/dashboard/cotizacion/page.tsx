"use client";

import { useState } from "react";

export default function CotizacionPage() {
  const [monto, setMonto] = useState("");
  const [ingreso, setIngreso] = useState("");

  const handleCotizar = () => {
    console.log({ monto, ingreso });

    // aquí llamarás a tu API futura
    // /simulador o /cotizacion
  };

  return (
    <section className="portal-stack">
      <div className="hero-panel">
        <div>
          <h2>Captura tu información</h2>
          <p>Ingresa los datos para cotizar tu crédito</p>
        </div>
      </div>

      <div className="product-card">
        <div className="form-grid">
          <input
            placeholder="Ingreso mensual"
            value={ingreso}
            onChange={(e) => setIngreso(e.target.value)}
          />

          <input
            placeholder="Monto solicitado"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>

        <button onClick={handleCotizar} className="btn-primary">
          COTIZAR
        </button>
      </div>
    </section>
  );
}