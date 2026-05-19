// app/dashboard/solicitud/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getApplicationRequest, getClientProfile } from "@/lib/api";
import type { ClientProfile } from "@/lib/types";
import { get } from "http";

type TablaRow = {
  periodo?: number;
  saldo_inicial?: number;
  interes?: number;
  capital?: number;
  pago?: number;
  saldo_final?: number;
  place?: number;
  interest?: number;
  amortized?: number;
  paid?: number;
  final?: number;
};

type SolicitudDetalle = {
  id: number;
  estatus_id: number;
  estatus: string;
  monto_credito: number;
  plazo_meses: number;
  monto_pago: number;
  monto_total: number;
  fecha_registro: string;
  producto: string | null;
  tabla: TablaRow[];
};

function fmtMoney(value: number) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function statusClass(estatusId: number) {
  if ([11, 12, 13, 14, 49, 680].includes(estatusId)) return "is-info";
  if (estatusId === 15) return "is-warning";
  if (estatusId === 16) return "is-success";
  if ([17, 50, 681].includes(estatusId)) return "is-danger";
  return "is-muted";
}

export default function SolicitudDetallePage() {
  const params = useParams();
  const id = Number(params.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTabla, setShowTabla] = useState(false);
  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [cliente, setCliente] = useState<ClientProfile | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [solicitudRes, clienteRes] = await Promise.all([
          getApplicationRequest(id),
          getClientProfile(),
        ]);

        setSolicitud(solicitudRes as SolicitudDetalle);
        setCliente(clienteRes as ClientProfile);
      } catch (error) {
        console.error("Error cargando detalle de la solicitud:", error);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id]);

  const numeroPagos = useMemo(() => {
    return Array.isArray(solicitud?.tabla) ? solicitud!.tabla.length : 0;
  }, [solicitud]);

  if (loading) {
    return <p style={{ padding: 20 }}>Cargando solicitud...</p>;
  }

  if (!solicitud || !cliente) {
    return <p style={{ padding: 20 }}>No se encontro la solicitud o el cliente</p>
  }

  return (
    <section className="portal-stack">
      <div className="hero-panel">
        <h2>Detalles de la Solicitud</h2>
        <p>
          Revisa la información general, condiciones de crédito y tabla de pago
          periódico.
        </p>
      </div>

      <div className="exp-grid">
        <div className="table-card" style={{ padding: 0 }}>
          <p className="hero-kicker section-kicker">Datos Generales</p>
          <table className="portal-table">
            <tbody>
              <tr>
                <td className="subtitulo"><b>RFC</b></td>
                <td>{cliente.rfc || "-"}</td>
              </tr>
              <tr>
                <td className="subtitulo"><b>CURP</b></td>
                <td>{cliente.curp || "-"}</td>
              </tr>
              <tr>
                <td className="subtitulo"><b>CLIENTE</b></td>
                <td>
                  {[
                    cliente.nombre,
                    cliente.apellido_paterno,
                    cliente.apellido_materno,
                  ]
                    .filter(Boolean)
                    .join(" ")
                  }
                </td>
              </tr>
              <tr>
                <td className="subtitulo"><b>EMAIL</b></td>
                <td>{cliente.correo || "-"}</td>
              </tr>
              <tr>
                <td className="subtitulo"><b>TELEFONO</b></td>
                <td>{cliente.telefono_movil || "-"}</td>
              </tr>
              <tr>
                <td className="subtitulo">DOMICILIO</td>
                <td>
                  {[cliente.domicilio_calle, cliente.domicilio_numero, cliente.domicilio_cp]
                    .filter(Boolean)
                    .join(" ")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="table-card" style={{ padding: 0 }}>
          <p className="hero-kicker section-kicker">
            {solicitud.estatus_id === 14
              ? "Condiciones Autorizadas de Crédito"
              : "Datos de la Solicitud"}
          </p>
          <table className="portal-table">
            <tbody>
              <tr>
                <td className="subtitulo"><b>NUM SOLICITUD</b></td>
                <td>{solicitud.id || "-"}</td>
              </tr>
              <tr>
                <td className="subtitulo"><b>ESTATUS</b></td>
                <td>
                  <span className={"status-pill " + statusClass(solicitud.estatus_id)}>
                    {solicitud.estatus || "-"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="subtitulo"><b>MONTO SOLICITADO</b></td>
                <td>{fmtMoney(solicitud.monto_credito)}</td>
              </tr>
              <tr>
                <td className="subtitulo"><b>PRODUCTO</b></td>
                <td>{solicitud.producto || "-"}</td>
              </tr>
              <tr>
                <td className="subtitulo"><b>NUM PAGOS</b></td>
                <td>{numeroPagos}</td>
              </tr>
              <tr>
                <td className="subtitulo"><b>PAGO PERIODICO</b></td>
                <td>{fmtMoney(solicitud.monto_pago)}</td>
              </tr>
              <tr>
                <td className="subtitulo"><b>TABLA DE PAGO PERIODICO</b></td>
                <td>
                  <button
                    className="exp-btn-action"
                    type="button"
                    onClick={() => setShowTabla((prev) => !prev)}
                  >
                    {showTabla ? "Ocultar" : "Mostrar"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          {solicitud.estatus_id === 14 ? (
            <div className="exp-warning">
              Sie estás de acuerdo con las condiciones aprobadas de tu crédito,
              presiona ACEPTAR Y FIRMAR para continuar con el proceso de firma de tu contrato.
            </div>
          ) : null}
        </div>
      </div>

      {showTabla ? (
        <div className="table-card" style={{ padding: 0 }}>
          <p className="hero-kicker section-kicker">Tabla de amortización</p>
          <table className="portal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Saldo inicial</th>
                <th>Interés</th>
                <th>Capital</th>
                <th>Pago</th>
                <th>Saldo Final</th>
              </tr>
            </thead>
            <tbody>
              {solicitud.tabla?.length ? (
                solicitud.tabla.map((row, index) => (
                  <tr key={index}>
                    <td>{row.periodo ?? row.place ?? index + 1}</td>
                    <td>{fmtMoney(row.saldo_inicial ?? row.capital ?? 0)}</td>
                    <td>{fmtMoney(row.interes ?? row.interest ?? 0)}</td>
                    <td>{fmtMoney(row.capital ?? row.amortized ?? 0)}</td>
                    <td>{fmtMoney(row.pago ?? row.paid ?? 0)}</td>
                    <td>{fmtMoney(row.saldo_final ?? row.final ?? 0)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>No hay datos disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      <style jsx>{`
        .exp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 980px) {
          .exp-grid {
            grid-template-columns: 1fr;
          }
        }

        .section-kicker {
          padding: 16px 22px 6px;
          margin: 0;
        }

        .subtitulo {
          color: var(--muted);
          width: 220px;
          white-space: nowrap;
          font-size: 0.88rem;
        }
           .status-pill {
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 0.8rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          line-height: 1;
        }

        .status-pill.is-info {
          background: #dcecff;
          color: #184d8f;
        }

        .status-pill.is-warning {
          background: #fff1d9;
          color: #9a5d00;
        }

        .status-pill.is-success {
          background: #ddf6e6;
          color: #1f7f3a;
        }
        
        .status-pill.is-danger {
          background: #fde7e7;
          color: #b22929;
        }

        .status-pill.is-muted {
          background: #eef1f5;
          color: #4c5968;
        }

        .exp-warning {
          margin: 14px 20px 20px;
          border: 1px solid #efb2b2;
          border-radius: 10px;
          background: #fff0f0;
          color: #8e2525;
          font-weight: 600;
          text-align: center;
          padding: 12px 14px;
        }

         .exp-btn-action {
          background: none;
          border: 1px solid var(--line);
          border-radius: 10px;
          color: var(--accent);
          cursor: pointer;
          font-size: 0.82rem;
          padding: 6px 14px;
          transition: border-color 0.15s, background 0.15s;
        }

        .exp-btn-action:hover {
          border-color: var(--accent);
          background: rgba(31, 94, 255, 0.05);
        }
      `}</style>     
    </section>
  );
}

