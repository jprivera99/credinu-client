"use client";

import { useEffect, useState } from "react";
import { detalleRequest } from "@/lib/api";
import { useSearchParams } from "next/navigation";

export default function DetallePage() {
  const params = useSearchParams();

  const producto_id = Number(params.get("producto_id"));
  const monto = Number(params.get("monto"));
  const plazo = Number(params.get("plazo"));

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await detalleRequest({
          producto_id,
          monto,
          plazo,
        });

        setData(res);
      } catch (error) {
        console.error("DETALLE ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    if (producto_id && monto && plazo) {
      fetch();
    }
  }, [producto_id, monto, plazo]);

  if (loading) return <p>Cargando...</p>;
  if (!data) return <p>No hay datos</p>;

  return (
    <section className="portal-stack">
      <div className="hero-panel">
        <h2>{data.producto}</h2>

        <p><b>Monto:</b> ${data.monto.toLocaleString()}</p>
        <p><b>Plazo:</b> {data.plazo}</p>
        <p><b>Tasa:</b> {data.tasa}%</p>
        <p><b>Pago:</b> ${data.pago.toFixed(2)}</p>
      </div>

      <div className="hero-panel">
        <h3>Tabla de amortización</h3>

        <div style={{ overflowX: "auto" }}>
          <table className="table">
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