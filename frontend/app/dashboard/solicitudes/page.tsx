"use client";

import { useEffect, useState } from "react";
import { getClientApplications } from "@/lib/api";
import type { ApplicationItemNew } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function SolicitudesPage() {
  const [applications, setApplications] = useState<ApplicationItemNew[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getClientApplications()
      .then((data) => setApplications(data))
      .finally(() => setLoading(false));
  }, []);

  const formatFolio = (id: number) => {
    return id.toString().padStart(5, "0");
  };

  const formatFecha = (fecha?: string) => {
    if (!fecha) return "-";
    return fecha.substring(0, 10);
  };

  const formatMonto = (monto?: number) => {
    if (!monto) return "$0.00";
    return monto.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  return (
    <section className="portal-stack">
      <div className="hero-panel">
        <div>
          <p className="hero-kicker">Seguimiento</p>
          <h2>Solicitudes de crédito</h2>
          <p>Consulta el estado de tus solicitudes</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Cargando solicitudes...</div>
      ) : applications.length === 0 ? (
        <div className="empty-state">Aún no tienes solicitudes.</div>
      ) : (
        <div className="table-card">
          <table className="portal-table">
            <thead>
              <tr>
                <th>No. Solicitud</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Estatus</th>
              </tr>
            </thead>

            <tbody>
              {applications.map((item) => (
                <tr key={item.id}>

                  <td style={{ position: "relative" }}>
                    <b>{formatFolio(item.id)}</b>

                    {item.estatus_id === 14 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-5px",
                          right: "-10px",
                          background: "red",
                          color: "#fff",
                          borderRadius: "50%",
                          padding: "2px 6px",
                          fontSize: "10px",
                        }}
                      >
                        !
                      </span>
                    )}

                    <br />

                    <button
                      className="link-button"
                      onClick={() =>
                        router.push(`/solicitudes/${item.id}`)
                      }
                    >
                      Detalles
                    </button>
                  </td>

                  <td>{formatFecha(item.fecha_registro)}</td>

                  <td>{formatMonto(item.monto_credito)}</td>
                  
                  <td>{item.estatus ?? "Sin estatus"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}