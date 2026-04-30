"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDetalleCotizacion } from "@/lib/api";
import { Pago, DetalleCotizacion } from "@/lib/types";

export default function CotizacionDetallePage() {
  const searchParams = useSearchParams();

  const monto = Number(searchParams.get("monto") || 0);
  const plazo = Number(searchParams.get("plazo") || 0);
  const producto_id = Number(searchParams.get("producto_id") || 0);

  const [tabla, setTabla] = useState<Pago[]>([]);
  const [info, setInfo] = useState<DetalleCotizacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDetalleCotizacion({
        monto,
        plazo,
        producto_id,
      });

      setInfo(data);
      setTabla(data.tabla);
    } catch (err: any) {
      setError(err.message || "Error al obtener detalle");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (monto && plazo && producto_id) {
      cargarDetalle();
    }
  }, [monto, plazo, producto_id]);

  return (
    <section className="portal-stack">
      {/* HEADER */}
      <div className="hero-panel">
        <div>
          <h2>Detalle de cotización</h2>
          <p>Simulación financiera del crédito</p>
        </div>
      </div>

      {/* LOADING */}
      {loading && <p style={{ textAlign: "center" }}>Cargando...</p>}

      {/* ERROR */}
      {error && (
        <p style={{ color: "red", textAlign: "center" }}>{error}</p>
      )}

      {/* RESUMEN */}
      {info && (
        <div
          className="product-card"
          style={{
            textAlign: "center",
            border: "2px solid #1e3a8a",
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>{info.producto}</h3>

          <p>
            💰 Monto: <b>${info.monto.toLocaleString()}</b>
          </p>
          <p>
            📆 Plazo: <b>{info.plazo}</b>
          </p>
          <p>
            📊 Tasa: <b>{info.tasa}%</b>
          </p>

          <h2 style={{ color: "#1e3a8a", marginTop: "10px" }}>
            Pago por periodo: ${info.pago.toLocaleString()}
          </h2>
        </div>
      )}

      {/* TABLA AMORTIZACIÓN */}
      {tabla.length > 0 && (
        <div className="product-card">
          <h4 style={{ textAlign: "center", marginBottom: "10px" }}>
            Tabla de amortización
          </h4>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                fontSize: "12px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#1e3a8a", color: "#fff" }}>
                  <th>#</th>
                  <th>Saldo Inicial</th>
                  <th>Interés</th>
                  <th>Capital</th>
                  <th>Pago</th>
                  <th>Saldo Final</th>
                </tr>
              </thead>

              <tbody>
                {tabla.map((row, index) => (
                  <tr
                    key={row.periodo}
                    style={{
                      background: index % 2 === 0 ? "#f9f9f9" : "#fff",
                    }}
                  >
                    <td>{row.periodo}</td>
                    <td>${row.saldo_inicial.toLocaleString()}</td>
                    <td style={{ color: "red" }}>
                      ${row.interes.toLocaleString()}
                    </td>
                    <td style={{ color: "green" }}>
                      ${row.capital.toLocaleString()}
                    </td>
                    <td>
                      <b>${row.pago.toLocaleString()}</b>
                    </td>
                    <td>${row.saldo_final.toLocaleString()}</td>
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