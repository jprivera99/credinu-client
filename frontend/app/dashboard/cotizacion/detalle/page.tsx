"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDetalleCotizacion } from "@/lib/api";

type Pago = {
  periodo: number;
  saldo_inicial: number;
  interes: number;
  capital: number;
  pago: number;
  saldo_final: number;
};

type Detalle = {
  producto: string;
  monto: number;
  plazo: number;
  tasa: number;
  pago: number;
  tabla: Pago[];
};

export default function CotizacionDetallePage() {
  const searchParams = useSearchParams();

  const monto = Number(searchParams.get("monto") || 0);
  const plazo = Number(searchParams.get("plazo") || 0);
  const producto_id = Number(searchParams.get("producto_id") || 0);

  const [info, setInfo] = useState<Detalle | null>(null);
  const [tabla, setTabla] = useState<Pago[]>([]);
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

      console.log("DETALLE RESPONSE:", data);

      setInfo(data);
      setTabla(data?.tabla || []);
    } catch (err: any) {
      console.error(err);
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
        <h2>Detalle de cotización</h2>
        <p>Simulación real del crédito</p>
      </div>

      {loading && <p style={{ textAlign: "center" }}>Cargando...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* INFO TIPO CARD */}
      {info && (
        <div
          style={{
            border: "1px solid #0ea5e9",
            borderRadius: "8px",
            padding: "15px",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "red" }}>{info.producto}</h3>

          <p>Monto: <b>${info.monto.toLocaleString()}</b></p>
          <p>Plazo: <b>{info.plazo}</b></p>
          <p>Tasa: <b>{info.tasa}%</b></p>
          <p>Pago: <b>${info.pago.toLocaleString()}</b></p>
        </div>
      )}

      {/* TABLA */}
      {tabla.length > 0 && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", fontSize: "12px" }}>
            <thead style={{ background: "#f3f4f6" }}>
              <tr>
                <th>#</th>
                <th>Saldo Inicial</th>
                <th>Interés</th>
                <th>Capital</th>
                <th>Pago</th>
                <th>Saldo Final</th>
              </tr>
            </thead>

            <tbody>
              {tabla.map((row) => (
                <tr key={row.periodo}>
                  <td>{row.periodo}</td>
                  <td>${row.saldo_inicial.toLocaleString()}</td>
                  <td>${row.interes.toLocaleString()}</td>
                  <td>${row.capital.toLocaleString()}</td>
                  <td>${row.pago.toLocaleString()}</td>
                  <td>${row.saldo_final.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}