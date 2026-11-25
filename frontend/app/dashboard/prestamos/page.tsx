"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLoansRequest } from "@/lib/api";
import type { Prestamo } from "@/lib/solicitud";
import { formatFecha, formatMoney } from "@/lib/solicitud";
import { Alert, EmptyState, Loading, PageHeader, errorMessage } from "@/components/portal/ui";

const tonoEstatus = (estatus: string) => {
  const e = String(estatus || "").toLowerCase();
  if (e.includes("liquid") || e.includes("pagad") || e.includes("cerrad")) return "neutral";
  if (e.includes("venc") || e.includes("mora") || e.includes("atras")) return "danger";
  return "success";
};

export default function PrestamosPage() {
  const [items, setItems] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getLoansRequest()
      .then((data) => setItems(data || []))
      .catch((err) => setError(errorMessage(err, "No fue posible consultar tus préstamos")))
      .finally(() => setLoading(false));
  }, []);

  const saldoTotal = items.reduce((acc, p) => acc + (Number(p.saldo) || 0), 0);

  return (
    <div className="cx-page">
      <PageHeader
        eyebrow="Mis préstamos"
        title="Préstamos contratados"
        subtitle="Consulta el saldo y el avance de pago de tus créditos."
      />

      {loading ? <Loading text="Consultando tus préstamos..." /> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="No tienes préstamos activos"
          text="Cuando tu crédito sea dispersado aparecerá aquí."
          action={
            <Link href="/dashboard/cotizacion" className="cx-btn cx-btn-primary">
              Cotizar un crédito
            </Link>
          }
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <>
          <div className="cx-grid cx-grid-3">
            <div className="cx-stat">
              <p className="cx-stat-label">Préstamos</p>
              <p className="cx-stat-value">{items.length}</p>
            </div>
            <div className="cx-stat">
              <p className="cx-stat-label">Saldo total</p>
              <p className="cx-stat-value">{formatMoney(saldoTotal)}</p>
            </div>
            <div className="cx-stat">
              <p className="cx-stat-label">Pagos pendientes</p>
              <p className="cx-stat-value">{items.reduce((a, p) => a + (p.pagos_pendientes || 0), 0)}</p>
            </div>
          </div>

          <div className="cx-grid cx-grid-2">
            {items.map((p) => {
              const avance = p.pagos_totales ? Math.round((p.pagos_realizados / p.pagos_totales) * 100) : 0;
              return (
                <article key={String(p.id)} className="cx-card">
                  <div className="cx-card-header" style={{ marginBottom: 12 }}>
                    <div>
                      <p className="cx-eyebrow">Contrato {p.id}</p>
                      <h3 className="cx-card-title">{p.producto || "Préstamo"}</h3>
                    </div>
                    {p.estatus ? <span className={`cx-badge cx-badge-${tonoEstatus(p.estatus)}`}>{p.estatus}</span> : null}
                  </div>

                  <dl className="cx-dl">
                    <dt>Fecha</dt>
                    <dd>{formatFecha(p.fecha)}</dd>
                    <dt>Monto</dt>
                    <dd>{formatMoney(p.monto)}</dd>
                    <dt>Plazo</dt>
                    <dd>
                      {p.plazo} {p.tipo_duracion || ""} {p.periodicidad ? `(${p.periodicidad})` : ""}
                    </dd>
                    <dt>Pago</dt>
                    <dd>{formatMoney(p.pago)}</dd>
                    <dt>Saldo</dt>
                    <dd>{formatMoney(p.saldo)}</dd>
                  </dl>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span className="cx-card-text" style={{ margin: 0 }}>
                        {p.pagos_realizados} de {p.pagos_totales} pagos realizados
                      </span>
                      <b>{avance}%</b>
                    </div>
                    <div className="cx-progress" style={{ marginTop: 8 }}>
                      <span style={{ width: `${avance}%` }} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
