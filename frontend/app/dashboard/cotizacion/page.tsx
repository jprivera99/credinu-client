"use client";

import { useState } from "react";
import { cotizarRequest } from "@/lib/api";

export default function CotizacionPage() {
  const [monto, setMonto] = useState("");
  const [ingreso, setIngreso] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCotizar = async () => {
    if (!monto || !ingreso) return;

    try {
      setLoading(true);

      const data = await cotizarRequest({
        monto: Number(monto),
        ingreso: Number(ingreso),
      });

      console.log("RESULTADOS:", data); // DEBUG
      setResultados(data);
    } catch (err) {
      console.error(err);
      alert("Error al cotizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ padding: "20px" }}>
      
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h3>Captura la información que te solicitamos y presiona "Cotizar".</h3>
      </div>

      {/* FORM (igual PHP) */}
      <div
        style={{
          background: "#eee",
          padding: "20px",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <div>
            <label>Ingreso recibido en tu última nómina:</label>
            <input
              type="number"
              value={ingreso}
              onChange={(e) => setIngreso(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div>
            <label>¿Cuánto dinero necesitas?</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleCotizar}
            style={{
              background: "#1e3a8a",
              color: "white",
              padding: "10px 30px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "COTIZANDO..." : "COTIZAR"}
          </button>
        </div>
      </div>

      {/* RESULTADOS */}
      {resultados.length > 0 && (
        <>
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <h3>Créditos disponibles para ti</h3>
            <p>(Puedes modificar el monto y plazo en DETALLES)</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            {resultados.map((prod) => (
              <div
                key={prod.producto_id}
                style={{
                  border: "2px solid #4aa3df",
                  borderRadius: "10px",
                  padding: "15px",
                  textAlign: "center",
                }}
              >
                <h4 style={{ color: "red" }}>
                  <b>{prod.nombre}</b>
                </h4>

                <p>
                  Préstamo hasta por: <br />
                  <b>${prod.monto_aprobado.toLocaleString()}</b>
                </p>

                <p>
                  en <b>{prod.plazo}</b> pagos
                </p>

                <p>
                  Pago semanal: <br />
                  <b>${prod.pago_semanal?.toLocaleString()}</b>
                </p>

                <button
                  style={{
                    marginTop: "10px",
                    border: "1px solid blue",
                    padding: "6px 15px",
                    borderRadius: "6px",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  DETALLES
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}