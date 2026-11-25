"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cancelApplicationRequest, getClientApplications } from "@/lib/api";
import type { SolicitudListado } from "@/lib/solicitud";
import { formatFecha, formatFolio, formatMoney } from "@/lib/solicitud";
import { Alert, EmptyState, Loading, Modal, PageHeader, StatusBadge, errorMessage } from "@/components/portal/ui";

export default function SolicitudesPage() {
  const [items, setItems] = useState<SolicitudListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelar, setCancelar] = useState<SolicitudListado | null>(null);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    getClientApplications()
      .then((data) => setItems(data || []))
      .catch((err) => setError(errorMessage(err, "No fue posible cargar tus solicitudes")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const confirmarCancelacion = async () => {
    if (!cancelar) return;
    setProcesando(true);
    try {
      await cancelApplicationRequest(cancelar.id);
      setCancelar(null);
      cargar();
    } catch (err) {
      setError(errorMessage(err));
      setCancelar(null);
    } finally {
      setProcesando(false);
    }
  };

  const pendientesFirma = items.filter((i) => i.requiere_firma);

  return (
    <div className="cx-page">
      <PageHeader
        eyebrow="Seguimiento"
        title="Solicitudes de crédito"
        subtitle="Consulta el estado de tus solicitudes y continúa las que tengas pendientes."
        actions={
          <Link href="/dashboard/cotizacion" className="cx-btn cx-btn-primary">
            Nueva solicitud
          </Link>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}

      {pendientesFirma.length ? (
        <Alert tone="warning">
          Tienes {pendientesFirma.length === 1 ? "un contrato listo" : `${pendientesFirma.length} contratos listos`} para
          firmar. Entra a <b>Detalles</b> y presiona <b>Aceptar y firmar</b>.
        </Alert>
      ) : null}

      {loading ? <Loading text="Cargando solicitudes..." /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="Aún no tienes solicitudes"
          text="Cotiza un crédito para iniciar tu primera solicitud."
          action={
            <Link href="/dashboard/cotizacion" className="cx-btn cx-btn-primary">
              Ir al cotizador
            </Link>
          }
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="cx-card" style={{ padding: 0 }}>
          <div className="cx-table-wrap" style={{ border: 0 }}>
            <table className="cx-table">
              <thead>
                <tr>
                  <th>No. solicitud</th>
                  <th>Producto</th>
                  <th>Fecha</th>
                  <th className="cx-num">Monto</th>
                  <th>Estatus</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b>{formatFolio(s.id)}</b>
                    </td>
                    <td>{s.producto || "—"}</td>
                    <td>{formatFecha(s.fecha_registro)}</td>
                    <td className="cx-num">{formatMoney(s.monto_credito)}</td>
                    <td>
                      <StatusBadge estatusId={s.estatus_id} text={s.estatus} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {s.puede_continuar ? (
                          <>
                            <Link href={`/dashboard/solicitud/${s.id}`} className="cx-btn cx-btn-primary cx-btn-sm">
                              Continuar
                            </Link>
                            <button
                              type="button"
                              className="cx-btn cx-btn-danger cx-btn-sm"
                              onClick={() => setCancelar(s)}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : null}
                        <Link
                          href={`/dashboard/solicitud/${s.id}/expediente`}
                          className={`cx-btn cx-btn-sm ${s.requiere_firma ? "cx-btn-success" : "cx-btn-secondary"}`}
                        >
                          {s.requiere_firma ? "Firmar contrato" : "Detalles"}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(cancelar)}
        title="¿Cancelar solicitud?"
        onClose={() => setCancelar(null)}
        actions={
          <>
            <button type="button" className="cx-btn cx-btn-secondary" onClick={() => setCancelar(null)}>
              No, regresar
            </button>
            <button type="button" className="cx-btn cx-btn-danger" onClick={confirmarCancelacion} disabled={procesando}>
              {procesando ? "Cancelando..." : "Sí, cancelar"}
            </button>
          </>
        }
      >
        <p>
          La solicitud {cancelar ? formatFolio(cancelar.id) : ""} quedará cancelada y podrás crear una nueva desde el
          cotizador.
        </p>
      </Modal>
    </div>
  );
}
