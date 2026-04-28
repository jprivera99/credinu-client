"use client";

import { useEffect, useState } from "react";
import { getProductosRequest } from "@/lib/api";
import type { institutionItem } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function ProductosPage() {
  const [products, setProducts] = useState<institutionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await getProductosRequest();
        setProducts(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error al cargar productos");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const formatFecha = (mes?: number, dia?: number) => {
    if (!mes || !dia) return null;

    const año = new Date().getFullYear();
    const fecha = new Date(año, mes - 1, dia);

    if (fecha < new Date()) return null;

    return fecha
      .toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  };

  const goToCotizacion = (id: number) => {
    router.push(`/dashboard/cotizacion?producto_id=${id}`);
  };

  return (
    <section className="portal-stack">
      {/* HERO ORIGINAL */}
      <div className="hero-panel">
        <div>
          <p className="hero-kicker">Catálogo activo</p>
          <h2>Conoce nuestros productos</h2>
          <p>Explora los productos disponibles según tu institución.</p>
        </div>
      </div>

      {/* ESTADOS */}
      {loading && <div className="empty-state">Cargando productos...</div>}

      {error && (
        <div className="empty-state" style={{ color: "red" }}>
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">No hay productos disponibles</div>
      )}

      {/* GRID */}
      {!loading && !error && products.length > 0 && (
        <div className="product-grid portal-grid portal-grid-3">
          {products.map((product) => {
            const descripcionArray =
              product.descripcion && product.descripcion.length > 0
                ? product.descripcion.split(";")
                : [
                    `Monto: ${product.monto_min} - ${product.monto_max}`,
                    `Plazo: ${product.plazo_min} - ${product.plazo_max}`,
                    `Periodicidad: ${product.periodicidad}`,
                  ];

            const fecha = product.prod_simulador
              ? formatFecha(
                  product.prod_simulador.disponible_desde_mes,
                  product.prod_simulador.disponible_desde_dia,
                )
              : null;

            return (
              <div
                key={product.id}
                className="product-card"
                onClick={() => goToCotizacion(product.id)}
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* NOMBRE */}
                <h4
                  className="hero-kicker"
                  style={{ textAlign: "center", marginBottom: "10px" }}
                >
                  <b>{product.nombre_comercial}</b>
                </h4>

                {/* DESCRIPCIÓN */}
                <ul
                  className="product-description"
                  style={{ paddingLeft: "20px", fontSize: "13px" }}
                >
                  {descripcionArray.map((desc, index) => (
                    <li key={index}>{desc}</li>
                  ))}
                </ul>

                {/* DISPONIBILIDAD */}
                {fecha && (
                  <div style={{ textAlign: "center", marginTop: "10px" }}>
                    <b>
                      <u>Disponible a partir: {fecha}</u>
                    </b>
                  </div>
                )}

                {/* BOTÓN */}
                <div style={{ textAlign: "center", marginTop: "15px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // evita doble click
                      goToCotizacion(product.id);
                    }}
                    style={{
                      backgroundColor: "#e53935",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    SELECCIONAR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}