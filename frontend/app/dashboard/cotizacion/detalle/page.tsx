// app/dashboard/cotizacion/detalle/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { detalleRequest, createApplicationRequest } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function DetallePage() {
  const params = useSearchParams();
  const router = useRouter();

  const id = Number(params.get("id"));

  const [monto, setMonto] = useState(
    Number(params.get("monto")) || 0,
  );

  const [plazo, setPlazo] = useState(
    Number(params.get("plazo")) || 0,
  );

  const [ingreso, setIngreso] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  /*
  OBTENER INGRESO DESDE QUERY PARAMS
  */

  useEffect(() => {
    const ingresoParam = params.get("ingreso");

    console.log("INGRESO PARAM:", ingresoParam);

    if (ingresoParam) {
      setIngreso(Number(ingresoParam));
    }
  }, [params]);

  /*
  FETCH DETALLE
  */

  const fetchDetalle = async () => {
    try {
      setLoading(true);

      const res = await detalleRequest({
        id,
        monto: Number(monto),
        plazo: Number(plazo),
      });

      setData(res);
    } catch (error) {
      console.error("DETALLE ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
  CREAR SOLICITUD
  */

  const submitSolicitud = async () => {
    try {
      setLoading(true);

      console.log({
        id,
        monto,
        plazo,
        ingreso,
      });

      if (!ingreso || ingreso <= 0) {
        throw new Error("El ingreso es inválido");
      }

      const response = await createApplicationRequest({
        institucion_producto_id: Number(id),
        monto: Number(monto),
        plazo: Number(plazo),
        ingreso: Number(ingreso),
      });

      router.push(
        `/dashboard/solicitud/${response.solicitud_id}`,
      );
    } catch (error) {
      console.error("SOLICITUD ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarClick = () => {
    if (loading) return;
    setShowReminderModal(true);
  };

  const handleConfirmReminder = async () => {
    setShowReminderModal(false);
    await submitSolicitud();
  };

  /*
  INIT
  */

  useEffect(() => {
    if (id && monto && plazo) {
      fetchDetalle();
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
  LOADING
  */

  if (!data) {
    return <p style={{ padding: 20 }}>Cargando...</p>;
  }

  /*
  UI
  */

  return (
    <section className="portal-stack">
      {/* HEADER */}
      <div className="hero-panel">
        <h2>{data.producto}</h2>

        {/* INPUTS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 260px",
            gap: "15px",
            marginTop: "15px",
            alignItems: "end",
          }}
        >
          <div>
            <label>Monto</label>

            <input
              type="number"
              value={monto}
              onChange={(e) =>
                setMonto(Number(e.target.value))
              }
              className="register-input"
            />
          </div>

          <div>
            <label>Plazo</label>

            <input
              type="number"
              value={plazo}
              onChange={(e) =>
                setPlazo(Number(e.target.value))
              }
              className="register-input"
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              onClick={fetchDetalle}
              className="register-submit"
              disabled={loading}
            >
              {loading ? "CALCULANDO..." : "RECALCULAR"}
            </button>

            <button
              onClick={handleSolicitarClick}
              className="register-submit"
              disabled={loading}
            >
              QUIERO MI PRÉSTAMO
            </button>
          </div>
        </div>

        {/* RESUMEN */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px,1fr))",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <div className="product-card centered-card">
            <span className="card-label">Tasa</span>
            <h4>{data.tasa}%</h4>
          </div>

          <div className="product-card">
            <p>Pago periódico</p>
            <h4>${data.pago.toFixed(2)}</h4>
          </div>

          <div className="product-card">
            <p>Total a pagar</p>
            <h4>
              ${(data.pago * data.plazo).toFixed(2)}
            </h4>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="hero-panel">
        <div className="table-header">
          <h3>Tabla de amortización</h3>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Saldo Inicial</th>
                <th>Interés</th>
                <th>Capital</th>
                <th>Pago</th>
                <th>Saldo Final</th>
              </tr>
            </thead>

            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.tabla.map((row: any) => (
                <tr key={row.periodo}>
                  <td>{row.periodo}</td>
                  <td>
                    ${row.saldo_inicial.toFixed(2)}
                  </td>
                  <td>${row.interes.toFixed(2)}</td>
                  <td>${row.capital.toFixed(2)}</td>
                  <td>${row.pago.toFixed(2)}</td>
                  <td>
                    ${row.saldo_final.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="form-notice is-warning onboarding-warning" role="note">
        NOTA: El sistema ajusta el monto del crédito a la capacidad de pago y las políticas del producto.
      </p>

      {mounted && showReminderModal
        ? createPortal(
            <div className="confirm-modal-backdrop" role="dialog" aria-modal="true">
              <div className="confirm-modal">
                <h3>Recordatorio</h3>
                <div className="confirm-alert">
                  <span className="confirm-alert-icon">!</span>
                  <p>
                    Por favor, asegúrate de tener a la mano lo siguiente: Cuenta CLABE interbancaria,
                    Credencial INE, Últimos 3 recibos de Nómina, Comprobante de domicilio (predial,
                    luz, agua), Último estado de cuenta bancario.
                  </p>
                </div>

                <div className="confirm-modal-actions">
                  <button
                    type="button"
                    className="confirm-cancel"
                    onClick={() => setShowReminderModal(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="confirm-accept"
                    onClick={handleConfirmReminder}
                    disabled={loading}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}