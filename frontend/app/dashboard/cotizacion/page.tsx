"use client";

import { useState } from "react";
import { cotizarRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function CotizacionPage() {
  const router = useRouter();

  const [monto, setMonto] = useState("");
  const [ingreso, setIngreso] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
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
      });

      setResultados(data);
    } catch (err: any) {
      setError(err.message || "Error al cotizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-screen">
      <div className="register-panel">

        {/* HEADER */}
        <div className="register-header">
          <h2>Cotizador</h2>
          <p>Captura la información y presiona Cotizar</p>
        </div>

        {/* ERROR */}
        {error && <div className="register-error">{error}</div>}

        {/* FORM */}
        <div className="register-grid">
          <input
            type="number"
            placeholder="Ingreso recibido en tu última nómina"
            value={ingreso}
            onChange={(e) => setIngreso(e.target.value)}
            className="register-input"
          />

          <input
            type="number"
            placeholder="¿Cuánto dinero necesitas?"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="register-input"
          />
        </div>

        <button
          onClick={handleCotizar}
          disabled={loading}
          className="register-submit"
        >
          {loading ? "COTIZANDO..." : "COTIZAR"}
        </button>

        {/* RESULTADOS */}
        {resultados.length > 0 && (
          <>
            <div className="register-header" style={{ marginTop: "20px" }}>
              <h3>Créditos disponibles para ti</h3>
              <p>(Puedes modificar el monto y plazo en DETALLES)</p>
            </div>

            {/* GRID */}
            <div className="register-grid">
              {resultados.map((prod) => (
                <div key={prod.producto_id} className="product-card">

                  <h4 className="hero-kicker" style={{ color: "red" }}>
                    {prod.nombre}
                  </h4>

                  <p>
                    Préstamo hasta por:
                    <br />
                    <b>${prod.monto_aprobado.toLocaleString()}</b>
                  </p>

                  <p>
                    en <b>{prod.plazo}</b> pagos
                  </p>

                  <p>
                    Pago semanal:
                    <br />
                    <b>${prod.pago_semanal?.toLocaleString()}</b>
                  </p>

                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/cotizacion/detalle?producto_id=${prod.producto_id}&monto=${prod.monto_aprobado}&plazo=${prod.plazo}`
                      )
                    }
                    className="register-submit"
                    style={{ marginTop: "10px" }}
                  >
                    DETALLES
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}