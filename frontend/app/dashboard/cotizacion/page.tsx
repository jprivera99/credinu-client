"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { cotizarRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

type Resultado = {
  producto_id: number;
  nombre: string;
  monto_aprobado: number;
  plazo: number;
  pago_periodico: number;
};

export default function CotizacionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const producto_id = searchParams.get("producto_id");

  const [monto, setMonto] = useState("");
  const [ingreso, setIngreso] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCotizar = async () => {
    setError("");

    if (!monto || !ingreso) {
      setError("Ingresa monto e ingreso");
      return;
    }

    try {
      setLoading(true);

      const data = await cotizarRequest({
        monto: Number(monto),
        ingreso: Number(ingreso),
        producto_id: producto_id ? Number(producto_id) : undefined,
      });

      setResultados(data);
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

  return (
    <section className="portal-stack">
      {/* HERO */}
      <div className="hero-panel">
        <div>
          <h2>Cotiza tu crédito</h2>
          <p>Captura la información y presiona cotizar</p>
        </div>
      </div>

      {/* FORM */}
      <div className="product-card">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <input
            type="number"
            placeholder="Ingreso mensual"
            value={ingreso}
            onChange={(e) => setIngreso(e.target.value)}
          />

          <input
            type="number"
            placeholder="Monto solicitado"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <button
            onClick={handleCotizar}
            disabled={loading}
            style={{
              backgroundColor: "#1e3a8a",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "COTIZANDO..." : "COTIZAR"}
          </button>
        </div>

        {error && (
          <div style={{ color: "red", marginTop: "10px" }}>{error}</div>
        )}
      </div>

      {/* RESULTADOS */}
      {resultados.length > 0 && (
        <>
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <h3>Créditos disponibles para ti</h3>
          </div>

          <div className="product-grid portal-grid portal-grid-3">
            {resultados.map((res) => (
              <div key={res.producto_id} className="product-card">
                <h4 className="hero-kicker" style={{ textAlign: "center" }}>
                  <b>{res.nombre}</b>
                </h4>

                <p style={{ textAlign: "center" }}>
                  Préstamo hasta por:{" "}
                  <b>${res.monto_aprobado.toLocaleString()}</b>
                </p>

                <p style={{ textAlign: "center" }}>
                  en <b>{res.plazo}</b> pagos
                </p>

                <p style={{ textAlign: "center" }}>
                  Pago: <b>${res.pago_periodico.toLocaleString()}</b>
                </p>

                <div style={{ textAlign: "center", marginTop: "10px" }}>
                  <button
                    onClick={() =>
                      router.push(
                        `/cotizacion/detalle?producto_id=${res.producto_id}&monto=${res.monto_aprobado}&plazo=${res.plazo}`,
                      )
                    }
                    style={{
                      border: "1px solid #1976d2",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    DETALLES
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {resultados.length === 0 && !loading && (
        <p style={{ textAlign: "center" }}>No hay resultados</p>
      )}
    </section>
  );
}
