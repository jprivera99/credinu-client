"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProductosRequest } from "@/lib/api";
import type { institutionItem } from "@/lib/types";
import { EmptyState, Loading, PageHeader, Alert, errorMessage } from "@/components/portal/ui";

const fechaDisponible = (mes?: number, dia?: number) => {
  if (!mes || !dia) return null;
  const fecha = new Date(new Date().getFullYear(), mes - 1, dia);
  if (fecha < new Date()) return null;
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
};

export default function ProductosPage() {
  const [products, setProducts] = useState<institutionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProductosRequest()
      .then((data) => setProducts(data || []))
      .catch((err) => setError(errorMessage(err, "No fue posible cargar los productos")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="cx-page">
      <PageHeader
        eyebrow="Catálogo"
        title="Conoce nuestros productos"
        subtitle="Estos son los créditos disponibles para tu empresa. Cotiza el que más te convenga."
        actions={
          <Link href="/dashboard/cotizacion" className="cx-btn cx-btn-primary">
            Continuar al cotizador
          </Link>
        }
      />

      {loading ? <Loading text="Cargando productos..." /> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      {!loading && !error && products.length === 0 ? (
        <EmptyState title="Sin productos disponibles" text="Por ahora tu empresa no tiene productos activos." />
      ) : null}

      {!loading && !error && products.length > 0 ? (
        <div className="cx-grid cx-grid-3">
          {products.map((p) => {
            const lineas = p.descripcion
              ? p.descripcion.split(";").map((t) => t.trim()).filter(Boolean)
              : [];
            const fecha = p.prod_simulador
              ? fechaDisponible(p.prod_simulador.disponible_desde_mes, p.prod_simulador.disponible_desde_dia)
              : null;

            return (
              <article key={p.id} className="cx-product">
                <h3 className="cx-product-name">{p.nombre_comercial}</h3>
                {lineas.length ? (
                  <ul>
                    {lineas.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="cx-card-text" style={{ flex: 1 }}>
                    Consulta montos y plazos en el cotizador.
                  </p>
                )}
                {fecha ? <span className="cx-badge cx-badge-warning">Disponible a partir del {fecha}</span> : null}
                <Link href="/dashboard/cotizacion" className="cx-btn cx-btn-secondary cx-btn-block">
                  Cotizar
                </Link>
              </article>
            );
          })}
        </div>
      ) : null}

      {!loading && products.length > 0 ? (
        <p className="cx-subtitle" style={{ textAlign: "center" }}>
          Para seleccionar el crédito que más te conviene, presiona <b>Continuar al cotizador</b>.
        </p>
      ) : null}
    </div>
  );
}
