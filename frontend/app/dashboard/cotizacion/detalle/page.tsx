"use client";

import { useEffect, useState } from "react";
import { detalleRequest } from "@/lib/api";
import { useSearchParams } from "next/navigation";

export default function DetallePage() {
  const params = useSearchParams();

  const producto_id = Number(params.get("producto_id"));

  const [monto, setMonto] = useState(Number(params.get("monto")));
  const [plazo, setPlazo] = useState(Number(params.get("plazo")));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ================== FETCH ==================
  const fetchDetalle = async () => {
    try {
      setLoading(true);

      const res = await detalleRequest({
        producto_id,
        monto: Number(monto),
        plazo: Number(plazo),
      });

      setData(res);
    } catch (error) {
      console.error("DETALLE ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (producto_id && monto && plazo) {
      fetchDetalle();
    }
  }, []);

  // ================== UI ==================
  if (!data) return <p style={{ padding: 20 }}>Cargando...</p>;

  return (
    <section className="portal-stack">
      {/* HEADER */}
      <div className="hero-panel">
        <h2>{data.producto}</h2>

        {/* INPUTS EDITABLES */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 200px",
            gap: "15px",
            marginTop: "15px",
            alignItems: "end",
          }}
        >
          <div>
            <label>Monto</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              className="register-input"
            />
          </div>

          <div>
            <label>Plazo</label>
            <input
              type="number"
              value={plazo}
              onChange={(e) => setPlazo(Number(e.target.value))}
              className="register-input"
            />
          </div>

          <button
            onClick={fetchDetalle}
            className="register-submit"
            disabled={loading}
          >
            {loading ? "CALCULANDO..." : "RECALCULAR"}
          </button>
        </div>

        {/* RESUMEN */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <div className="product-card centered-card">
            <span className="card-label">Tasa</span>
            <h4>{data.tasa}%</h4>
          </div>

          <div className="product-card">
            <p>Pago periódico</p>
            <h4>${data.pago.toFixed(2)}</h4>
          </div>

          <div className="product-card">
            <p>Total a pagar</p>
            <h4>${(data.pago * data.plazo).toFixed(2)}</h4>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="hero-panel">
        {/* TITULO CENTRADO */}
        <div className="table-header">
          <h3>Tabla de amortización</h3>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.tabla.map((row: any) => (
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
    </section>
  );
}
