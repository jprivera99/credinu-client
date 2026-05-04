"use client";

import { useState } from "react";
import { cotizarRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function CotizacionPage() {
  const router = useRouter();

  const [monto, setMonto] = useState("");
  const [ingreso, setIngreso] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCotizar = async () => {
    setError("");

    if (!monto || !ingreso) {
      setError("Ingresa monto e ingreso");
      return;
    }

    try {
      setLoading(true);

      const data = await cotizarRequest({
        monto: Number(monto),
        ingreso: Number(ingreso),
      });

      setResultados(data);
    } catch (err: any) {
      setError(err.message || "Error al cotizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="portal-stack">

      {/* HEADER */}
      <div className="hero-panel">
        <div>
          <p className="hero-kicker">Seguimiento</p>
          <h2>Cotizador de crédito</h2>
          <p>Captura la información y presiona Cotizar</p>
        </div>
      </div>

      {/* FORMULARIO */}
      <div className="hero-panel">

        {error && <div className="register-error">{error}</div>}

        {/* INPUTS CENTRADOS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          <input
            type="number"
            placeholder="Ingreso recibido"
            value={ingreso}
            onChange={(e) => setIngreso(e.target.value)}
            className="register-input"
          />

          <input
            type="number"
            placeholder="Monto solicitado"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="register-input"
          />
        </div>

        {/* BOTON CENTRADO */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={handleCotizar}
            disabled={loading}
            className="register-submit"
            style={{
              width: "300px",
              maxWidth: "100%",
            }}
          >
            {loading ? "COTIZANDO..." : "COTIZAR"}
          </button>
        </div>
      </div>

      {/* RESULTADOS (ABAJO, NO A LA DERECHA) */}
      {resultados.length > 0 && (
        <div className="hero-panel">

          <div>
            <h3>Créditos disponibles para ti</h3>
            <p>(Puedes modificar el monto y plazo en DETALLES)</p>
          </div>

          {/* GRID CORRECTO */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {resultados.map((prod) => (
              <div
                key={prod.producto_id}
                className="product-card"
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  background: "#fff",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                  textAlign: "center",
                }}
              >
                <h4 className="hero-kicker" style={{ color: "red" }}>
                  {prod.nombre}
                </h4>

                <p>
                  Préstamo hasta por:
                  <br />
                  <b>${prod.monto_aprobado.toLocaleString()}</b>
                </p>

                <p>
                  en <b>{prod.plazo}</b> pagos
                </p>

                <p>
                  Pago semanal:
                  <br />
                  <b>${prod.pago_semanal?.toLocaleString()}</b>
                </p>

                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/cotizacion/detalle?producto_id=${prod.producto_id}&monto=${prod.monto_aprobado}&plazo=${prod.plazo}`
                    )
                  }
                  className="register-submit"
                  style={{ marginTop: "10px" }}
                >
                  DETALLES
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}