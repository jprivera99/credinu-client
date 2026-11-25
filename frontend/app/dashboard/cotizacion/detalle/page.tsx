"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createApplicationRequest, detalleRequest } from "@/lib/api";
import type { DetalleCotizacion } from "@/lib/solicitud";
import { formatMoney, pagosLabel, periodoLabel } from "@/lib/solicitud";
import {
  Alert,
  Card,
  Field,
  Loading,
  Modal,
  PageHeader,
  TablaAmortizacion,
  errorMessage,
} from "@/components/portal/ui";

function DetalleCotizacionContent() {
  const params = useSearchParams();
  const router = useRouter();

  const id = Number(params.get("id"));
  const ingreso = Number(params.get("ingreso"));

  const [monto, setMonto] = useState(params.get("monto") || "");
  const [plazo, setPlazo] = useState(Number(params.get("plazo")) || 0);
  const [data, setData] = useState<DetalleCotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const [express, setExpress] = useState(0);
  const [recordatorio, setRecordatorio] = useState(false);
  const [aviso, setAviso] = useState("");

  const calcular = useCallback(
    async (m: number, p: number) => {
      setError("");
      setLoading(true);
      try {
        const res = await detalleRequest({ id, monto: m, plazo: p, ingreso });
        setData(res);
        setMonto(String(res.monto));
        setPlazo(Number(res.plazo));
      } catch (err) {
        setError(errorMessage(err, "No fue posible calcular el crédito"));
      } finally {
        setLoading(false);
      }
    },
    [id, ingreso],
  );

  useEffect(() => {
    if (!id || !ingreso) {
      setError("Faltan datos de la cotización. Regresa al cotizador.");
      setLoading(false);
      return;
    }
    calcular(Number(params.get("monto")) || 0, Number(params.get("plazo")) || 0);
    // Solo al entrar a la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const solicitar = async () => {
    if (!data) return;
    setEnviando(true);
    try {
      const res = await createApplicationRequest({
        institucion_producto_id: id,
        monto: data.monto,
        plazo: data.plazo,
        ingreso,
        validar: true,
      });
      setExpress(Number(res?.express || 0));
      setRecordatorio(true);
    } catch (err) {
      setAviso(errorMessage(err, "No es posible solicitar este crédito por ahora."));
    } finally {
      setEnviando(false);
    }
  };

  const confirmar = async () => {
    if (!data) return;
    setRecordatorio(false);
    setEnviando(true);
    try {
      const res = await createApplicationRequest({
        institucion_producto_id: id,
        monto: data.monto,
        plazo: data.plazo,
        ingreso,
      });
      sessionStorage.removeItem("credinu.cotizador");
      router.push(`/dashboard/solicitud/${res.solicitud_id}`);
    } catch (err) {
      setAviso(errorMessage(err, "No fue posible crear la solicitud."));
      setEnviando(false);
    }
  };

  const opcionesPlazo: number[] = [];
  if (data) {
    const min = Math.ceil(Number(data.plazo_min) || Number(data.plazo));
    const max = Math.floor(Number(data.plazo_max) || Number(data.plazo));
    for (let i = min; i <= max && opcionesPlazo.length < 200; i++) opcionesPlazo.push(i);
    if (!opcionesPlazo.includes(Number(data.plazo))) opcionesPlazo.push(Number(data.plazo));
    opcionesPlazo.sort((a, b) => a - b);
  }

  if (loading && !data) return <Loading text="Calculando tu crédito..." />;

  return (
    <div className="cx-page">
      <PageHeader
        eyebrow="Detalle de la cotización"
        title={data?.producto || "Crédito"}
        subtitle="Puedes modificar el plazo y el monto de tu crédito."
        actions={
          <Link href="/dashboard/cotizacion" className="cx-btn cx-btn-secondary">
            Regresar
          </Link>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}

      {data ? (
        <>
          <Card>
            <div className="cx-grid cx-grid-3" style={{ alignItems: "end" }}>
              <Field label="Monto">
                <input
                  className="cx-input"
                  inputMode="decimal"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value.replace(/[^\d.]/g, ""))}
                />
              </Field>
              <Field label={`Plazo (${periodoLabel(data.periodicidad)})`}>
                {opcionesPlazo.length > 1 && !data.express ? (
                  <select className="cx-select" value={plazo} onChange={(e) => setPlazo(Number(e.target.value))}>
                    {opcionesPlazo.map((n) => (
                      <option key={n} value={n}>
                        {n} {periodoLabel(data.periodicidad, n !== 1)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className="cx-input" value={`${data.plazo} ${periodoLabel(data.periodicidad)}`} disabled />
                )}
              </Field>
              <button
                type="button"
                className="cx-btn cx-btn-secondary"
                disabled={loading}
                onClick={() => calcular(Number(monto) || 0, plazo)}
              >
                {loading ? "Calculando..." : "Recalcular"}
              </button>
            </div>
            <div style={{ marginTop: 16 }}>
              <Alert tone="warning">
                <b>Nota:</b> el sistema ajusta el monto del crédito a tu capacidad de pago y a las políticas del
                producto.
              </Alert>
            </div>
          </Card>

          <div className="cx-grid cx-grid-4">
            <div className="cx-stat">
              <p className="cx-stat-label">Monto del crédito</p>
              <p className="cx-stat-value">{formatMoney(data.monto)}</p>
            </div>
            <div className="cx-stat">
              <p className="cx-stat-label">Número de pagos</p>
              <p className="cx-stat-value">
                {data.num_pagos} <small style={{ fontSize: "0.85rem", fontWeight: 500 }}>{pagosLabel(data.periodicidad)}</small>
              </p>
            </div>
            <div className="cx-stat">
              <p className="cx-stat-label">Pago periódico</p>
              <p className="cx-stat-value">{formatMoney(data.pago)}</p>
            </div>
            <div className="cx-stat">
              <p className="cx-stat-label">Total a pagar</p>
              <p className="cx-stat-value">{formatMoney(data.total_pagar)}</p>
            </div>
          </div>

          <Card
            title="Tabla de pagos"
            actions={
              <button type="button" className="cx-btn cx-btn-success" onClick={solicitar} disabled={enviando || loading}>
                {enviando ? "Procesando..." : "Quiero mi préstamo"}
              </button>
            }
          >
            <TablaAmortizacion filas={data.tabla} completa={Boolean(data.detalle_completo)} />
          </Card>
        </>
      ) : null}

      <Modal
        open={recordatorio}
        title="Antes de continuar"
        onClose={() => setRecordatorio(false)}
        actions={
          <>
            <button type="button" className="cx-btn cx-btn-secondary" onClick={() => setRecordatorio(false)}>
              Cancelar
            </button>
            <button type="button" className="cx-btn cx-btn-primary" onClick={confirmar}>
              Continuar
            </button>
          </>
        }
      >
        <p>Por favor ten a la mano lo siguiente:</p>
        <ul style={{ margin: "10px 0 0", paddingLeft: 20, lineHeight: 1.7 }}>
          <li>Cuenta CLABE interbancaria</li>
          <li>Credencial INE</li>
          {express ? null : (
            <>
              <li>Últimos recibos de nómina</li>
              <li>Comprobante de domicilio</li>
              <li>Último estado de cuenta bancario</li>
            </>
          )}
        </ul>
      </Modal>

      <Modal
        open={Boolean(aviso)}
        title="Solicitud no disponible"
        onClose={() => setAviso("")}
        actions={
          <>
            <button type="button" className="cx-btn cx-btn-secondary" onClick={() => setAviso("")}>
              Cerrar
            </button>
            <Link href="/dashboard/mis-solicitudes" className="cx-btn cx-btn-primary">
              Ver mis solicitudes
            </Link>
          </>
        }
      >
        <p>{aviso}</p>
      </Modal>
    </div>
  );
}

export default function DetalleCotizacionPage() {
  return (
    <Suspense fallback={<Loading text="Cargando..." />}>
      <DetalleCotizacionContent />
    </Suspense>
  );
}
