"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cotizarRequest } from "@/lib/api";
import type { ProductoCotizado } from "@/lib/solicitud";
import { formatMoney, pagosLabel } from "@/lib/solicitud";
import { Alert, Card, EmptyState, Field, PageHeader, errorMessage } from "@/components/portal/ui";

const STORAGE_KEY = "credinu.cotizador";

const limpiar = (v: string) => v.replace(/[^\d.]/g, "");
const conComas = (v: string) => {
  const n = limpiar(v);
  if (!n) return "";
  const [ent, dec] = n.split(".");
  return Number(ent).toLocaleString("es-MX") + (dec !== undefined ? "." + dec.slice(0, 2) : "");
};

export default function CotizacionPage() {
  const router = useRouter();
  const [ingreso, setIngreso] = useState("");
  const [monto, setMonto] = useState("");
  const [resultados, setResultados] = useState<ProductoCotizado[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Conserva la última cotización al regresar de "Detalles".
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        setIngreso(saved.ingreso || "");
        setMonto(saved.monto || "");
        setResultados(saved.resultados || null);
      }
    } catch {
      /* sin datos guardados */
    }
  }, []);

  const handleCotizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ing = Number(limpiar(ingreso));
    const mon = Number(limpiar(monto));
    if (!ing || !mon) {
      setError("Captura tu ingreso y el monto que necesitas.");
      return;
    }

    try {
      setLoading(true);
      const data = await cotizarRequest({ ingreso: ing, monto: mon });
      setResultados(data);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ingreso, monto, resultados: data }));
    } catch (err) {
      setError(errorMessage(err, "No fue posible cotizar"));
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = (p: ProductoCotizado) => {
    const params = new URLSearchParams({
      id: String(p.id),
      monto: String(p.monto_aprobado),
      plazo: String(p.duracion),
      ingreso: limpiar(ingreso),
    });
    router.push(`/dashboard/cotizacion/detalle?${params.toString()}`);
  };

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="cx-page">
      <PageHeader
        eyebrow="Cotizador"
        title="¿Cuánto necesitas?"
        subtitle='Captura la información que te solicitamos y presiona "Cotizar".'
      />

      <Card>
        <form onSubmit={handleCotizar} className="cx-grid cx-grid-3" style={{ alignItems: "end" }}>
          <Field label="Ingreso recibido en tu última nómina" required>
            <input
              className="cx-input"
              inputMode="decimal"
              placeholder="$0.00"
              value={ingreso}
              maxLength={15}
              onChange={(e) => setIngreso(conComas(e.target.value))}
            />
          </Field>
          <Field label="¿Cuánto dinero necesitas?" required>
            <input
              className="cx-input"
              inputMode="decimal"
              placeholder="$0.00"
              value={monto}
              maxLength={15}
              onChange={(e) => setMonto(conComas(e.target.value))}
            />
          </Field>
          <button type="submit" className="cx-btn cx-btn-primary" disabled={loading}>
            {loading ? "Cotizando..." : "Cotizar"}
          </button>
        </form>
        {error ? (
          <div style={{ marginTop: 16 }}>
            <Alert tone="error">{error}</Alert>
          </div>
        ) : null}
      </Card>

      {resultados && resultados.length === 0 ? (
        <EmptyState
          title="No hay créditos disponibles con estos datos"
          text="Prueba con otro monto o revisa el ingreso capturado."
        />
      ) : null}

      {resultados && resultados.length > 0 ? (
        <>
          <div>
            <h3 className="cx-card-title">Créditos disponibles para ti</h3>
            <p className="cx-card-text">Puedes modificar el monto y el plazo en Detalles.</p>
          </div>
          <div className="cx-grid cx-grid-3">
            {resultados.map((p) => {
              const noDisponible = p.fecha_disponible && p.fecha_disponible > hoy;
              return (
                <article key={p.id} className="cx-product">
                  <h3 className="cx-product-name">{p.nombre_comercial}</h3>
                  <div>
                    <p className="cx-stat-label">Préstamo hasta por</p>
                    <p className="cx-stat-value">{formatMoney(p.monto_aprobado)}</p>
                  </div>
                  <p className="cx-card-text" style={{ flex: 1 }}>
                    En <b>{p.plazo}</b> pago(s) {pagosLabel(p.periodicidad)} de <b>{formatMoney(p.pago_periodico)}</b>
                  </p>
                  {noDisponible ? (
                    <span className="cx-badge cx-badge-warning">Disponible a partir del {p.fecha_disponible}</span>
                  ) : null}
                  <button
                    type="button"
                    className="cx-btn cx-btn-primary cx-btn-block"
                    onClick={() => verDetalle(p)}
                    disabled={Boolean(noDisponible)}
                  >
                    Detalles
                  </button>
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
