// app/dashboard/solicitud/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getApplicationRequest } from "@/lib/api";
import { useParams } from "next/navigation";

export default function SolicitudDetallePage() {
  const params = useParams();

  const id = Number(params.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolicitud = async () => {
      try {
        setLoading(true);

        const response = await getApplicationRequest(id);

        setData(response);
      } catch (error) {
        console.error("ERROR SOLICITUD:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSolicitud();
    }
  }, [id]);

  if (loading) {
    return <p style={{ padding: 20 }}>Cargando solicitud...</p>;
  }

  if (!data) {
    return <p style={{ padding: 20 }}>Solicitud no encontrada</p>;
  }

  return (
    <section className="portal-stack">
      {/* HEADER */}
      <div className="hero-panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <h2>{data.producto}</h2>

            <p
              style={{
                marginTop: "5px",
                opacity: 0.7,
              }}
            >
              Solicitud #{data.id}
            </p>
          </div>

          <div>
            <span
              style={{
                padding: "10px 15px",
                borderRadius: "10px",
                background: "#e8f0fe",
                fontWeight: 600,
              }}
            >
              {data.estatus}
            </span>
          </div>
        </div>

        {/* RESUMEN */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
            gap: "15px",
            marginTop: "25px",
          }}
        >
          <div className="product-card">
            <p>Monto solicitado</p>

            <h4>
              $
              {Number(data.monto_credito).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </h4>
          </div>

          <div className="product-card">
            <p>Pago periódico</p>

            <h4>
              $
              {Number(data.monto_pago).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </h4>
          </div>

          <div className="product-card">
            <p>Plazo</p>

            <h4>{data.plazo_meses}</h4>
          </div>

          <div className="product-card">
            <p>Total a pagar</p>

            <h4>
              $
              {Number(data.monto_total).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </h4>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="hero-panel">
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
              {data.tabla?.map((row: any, index: number) => (
                <tr key={index}>
                  <td>{row.periodo || row.place}</td>

                  <td>
                    $
                    {Number(
                      row.saldo_inicial || row.capital || 0,
                    ).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td>
                    $
                    {Number(row.interes || row.interest || 0).toLocaleString(
                      "es-MX",
                      {
                        minimumFractionDigits: 2,
                      },
                    )}
                  </td>

                  <td>
                    $
                    {Number(
                      row.capital_pagado || row.amortized || 0,
                    ).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td>
                    $
                    {Number(row.pago || row.paid || 0).toLocaleString(
                      "es-MX",
                      {
                        minimumFractionDigits: 2,
                      },
                    )}
                  </td>

                  <td>
                    $
                    {Number(
                      row.saldo_final || row.final || 0,
                    ).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}