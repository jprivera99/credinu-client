"use client";

import { useState } from "react";
import { cotizarRequest, detalleRequest } from "@/lib/api";
import { useRouter } from "next/navigation";


export default function CotizacionPage() {
  const [monto, setMonto] = useState("");
  const [ingreso, setIngreso] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resultados, setResultados] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detalle, setDetalle] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  

  // ================== COTIZAR ==================
  const handleCotizar = async () => {
    setError("");
    setDetalle(null);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <p className="hero-kicker">Seguimiento</p>
        <h2>Cotizador de crédito</h2>
        <p>Captura la información y presiona Cotizar</p>
      </div>

      {/* FORM */}
      <div className="hero-panel">
        {error && <div className="register-error">{error}</div>}

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

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={handleCotizar}
            disabled={loading}
            className="register-submit"
            style={{ width: "300px", maxWidth: "100%" }}
          >
            {loading ? "COTIZANDO..." : "COTIZAR"}
          </button>
        </div>
      </div>

      {/* RESULTADOS */}
      {resultados.length > 0 && (
        <div className="hero-panel">
          <h3>Créditos disponibles para ti</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            {resultados.map((prod) => (
              <div
                key={prod.producto_id}
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  background: "#fff",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                  textAlign: "center",
                }}
              >
                <h4 style={{ color: "red" }}>{prod.nombre}</h4>

                <p>
                  <b>${prod.monto_aprobado.toLocaleString()}</b>
                </p>

                <p>{prod.plazo} pagos</p>

                <p>
                  Pago:
                  <br />
                  <b>${prod.pago_semanal?.toLocaleString()}</b>
                </p>

                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/cotizacion/detalle?producto_id=${prod.producto_id}&monto=${prod.monto_aprobado}&plazo=${prod.plazo}`,
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

      {/* DETALLE (ABAJO COMO PHP) */}
      {detalle && (
        <div className="hero-panel">
          <h3>{detalle.producto}</h3>

          <p>
            <b>Monto:</b> ${detalle.monto.toLocaleString()}
          </p>
          <p>
            <b>Plazo:</b> {detalle.plazo}
          </p>
          <p>
            <b>Tasa:</b> {detalle.tasa}%
          </p>

          <div style={{ overflowX: "auto", marginTop: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th>#</th>
                  <th>Saldo Inicial</th>
                  <th>Interés</th>
                  <th>Capital</th>
                  <th>Pago</th>
                  <th>Saldo Final</th>
                </tr>
              </thead>

              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {detalle.tabla.map((row: any) => (
                  <tr key={row.periodo}>
                    <td>{row.periodo}</td>
                    <td>${row.saldo_inicial.toFixed(2)}</td>
                    <td>${row.interes.toFixed(2)}</td>
                    <td>${row.capital.toFixed(2)}</td>
                    <td>${row.pago.toFixed(2)}</td>
                    <td>${row.saldo_final.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
