"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getApplicationRequest,
  signApplicationRequest,
  signedContractRequest,
  uploadDocumentRequest,
} from "@/lib/api";
import type { SolicitudDetalle } from "@/lib/solicitud";
import { ESTATUS, formatFecha, formatFolio, formatMoney, leerArchivoBase64, pagosLabel } from "@/lib/solicitud";
import { Alert, Card, Loading, PageHeader, StatusBadge, TablaAmortizacion, errorMessage } from "@/components/portal/ui";
import { abrirDocumento } from "@/components/solicitud/Pasos";

// Estatus en los que el expediente ya no admite cambios de documentos (igual que el sistema actual).
const ESTATUS_SIN_CAMBIOS = [11, 14, 16, 17, 681];

const ESTADO_DOC = {
  faltante: { tono: "danger", texto: "Pendiente" },
  renovar: { tono: "warning", texto: "Actualizar" },
  vigente: { tono: "success", texto: "Vigente" },
} as const;

export default function ExpedientePage() {
  const params = useParams();
  const id = Number(params.id);

  const [data, setData] = useState<SolicitudDetalle | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const inputs = useRef<Record<number, HTMLInputElement | null>>({});

  const cargar = useCallback(() => {
    return getApplicationRequest(id)
      .then(setData)
      .catch((err) => setError(errorMessage(err, "No fue posible cargar la solicitud")));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const firmar = async () => {
    setAviso("");
    setProcesando(true);
    try {
      const r = await signApplicationRequest(id);
      window.location.href = r.url;
    } catch (err) {
      setAviso(errorMessage(err, "No fue posible abrir la firma del contrato"));
      setProcesando(false);
    }
  };

  const descargarContrato = async () => {
    setAviso("");
    const ventana = window.open("", "_blank");
    try {
      const r = await signedContractRequest(id);
      if (ventana) ventana.location.href = r.url;
      else window.location.href = r.url;
    } catch (err) {
      ventana?.close();
      setAviso(errorMessage(err, "El contrato aún no está disponible"));
    }
  };

  const subir = async (tipo: number, file?: File) => {
    if (!file) return;
    setAviso("");
    setSubiendo(tipo);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("El archivo no debe pesar más de 10 MB.");
      await uploadDocumentRequest({ tipo, nombre: file.name, base64: await leerArchivoBase64(file) });
      await cargar();
    } catch (err) {
      setAviso(errorMessage(err, "No fue posible subir el documento"));
    } finally {
      setSubiendo(null);
      if (inputs.current[tipo]) inputs.current[tipo]!.value = "";
    }
  };

  if (error) {
    return (
      <div className="cx-page">
        <Alert tone="error">{error}</Alert>
        <Link href="/dashboard/mis-solicitudes" className="cx-btn cx-btn-secondary" style={{ alignSelf: "flex-start" }}>
          Regresar
        </Link>
      </div>
    );
  }

  if (!data) return <Loading text="Cargando expediente..." />;

  const s = data.solicitud;
  const d = data.domicilio;
  const puedeSubir = !ESTATUS_SIN_CAMBIOS.includes(s.estatus_id);
  const domicilio = [
    d.calle && `${d.calle} ${d.numero_exterior}${d.numero_interior ? " Int. " + d.numero_interior : ""}`,
    d.colonia,
    d.municipio,
    d.estado,
    d.cp && `C.P. ${d.cp}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="cx-page">
      <PageHeader
        eyebrow={`Solicitud ${formatFolio(s.id)}`}
        title="Detalles de la solicitud"
        subtitle={<StatusBadge estatusId={s.estatus_id} text={s.estatus} />}
        actions={
          <>
            <Link href="/dashboard/mis-solicitudes" className="cx-btn cx-btn-secondary">
              Regresar
            </Link>
            {s.estatus_id === ESTATUS.SIN_ENVIAR ? (
              <Link href={`/dashboard/solicitud/${s.id}`} className="cx-btn cx-btn-primary">
                Continuar solicitud
              </Link>
            ) : null}
            {s.estatus_id === ESTATUS.FIRMA ? (
              <button type="button" className="cx-btn cx-btn-success" onClick={firmar} disabled={procesando}>
                {procesando ? "Abriendo..." : "Aceptar y firmar"}
              </button>
            ) : null}
            {s.estatus_id === ESTATUS.APROBADO ? (
              <button type="button" className="cx-btn cx-btn-primary" onClick={descargarContrato}>
                Descargar contrato
              </button>
            ) : null}
          </>
        }
      />

      {aviso ? <Alert tone="error">{aviso}</Alert> : null}

      {s.estatus_id === ESTATUS.SIN_ENVIAR ? (
        <Alert tone="warning">
          Esta solicitud aún no ha sido enviada. Para continuar, confirma tus datos y completa los campos faltantes.
        </Alert>
      ) : null}
      {s.estatus_id === ESTATUS.FIRMA ? (
        <Alert tone="success">
          ¡Tu crédito tiene condiciones autorizadas! Presiona <b>Aceptar y firmar</b> para firmar tu contrato de forma
          electrónica.
        </Alert>
      ) : null}
      {s.motivo_rechazo ? <Alert tone="error">Motivo: {s.motivo_rechazo}</Alert> : null}

      <div className="cx-grid cx-grid-4">
        <div className="cx-stat">
          <p className="cx-stat-label">Monto solicitado</p>
          <p className="cx-stat-value">{formatMoney(s.monto_credito)}</p>
        </div>
        <div className="cx-stat">
          <p className="cx-stat-label">Monto autorizado</p>
          <p className="cx-stat-value">{s.monto_autorizado ? formatMoney(s.monto_autorizado) : "—"}</p>
        </div>
        <div className="cx-stat">
          <p className="cx-stat-label">Pago periódico</p>
          <p className="cx-stat-value">{formatMoney(s.monto_pago)}</p>
        </div>
        <div className="cx-stat">
          <p className="cx-stat-label">Número de pagos</p>
          <p className="cx-stat-value">
            {s.total_pagos} <small style={{ fontSize: "0.85rem", fontWeight: 500 }}>{pagosLabel(s.periodicidad)}</small>
          </p>
        </div>
      </div>

      <div className="cx-grid cx-grid-2" style={{ alignItems: "start" }}>
        <Card title={s.estatus_id === ESTATUS.FIRMA ? "Condiciones autorizadas de crédito" : "Datos de la solicitud"}>
          <dl className="cx-dl">
            <dt>Producto</dt>
            <dd>{s.producto || "—"}</dd>
            <dt>Fecha de solicitud</dt>
            <dd>{formatFecha(s.fecha_registro)}</dd>
            <dt>Periodicidad</dt>
            <dd style={{ textTransform: "capitalize" }}>{s.periodicidad || "—"}</dd>
            <dt>Total a pagar</dt>
            <dd>{s.monto_total ? formatMoney(s.monto_total) : "—"}</dd>
            {Number(s.num_pagos_adelanto) > 0 ? (
              <>
                <dt>Pagos fijos</dt>
                <dd>
                  {s.num_pagos_adelanto} de {formatMoney(s.monto_adelanto)}
                </dd>
              </>
            ) : null}
          </dl>
        </Card>

        <Card title="Datos de depósito y domicilio">
          <dl className="cx-dl">
            <dt>Cuenta CLABE</dt>
            <dd style={{ fontVariantNumeric: "tabular-nums" }}>
              {s.clabe || "—"} {s.clabe_valida ? <span className="cx-badge cx-badge-success">Válida</span> : null}
            </dd>
            <dt>Banco</dt>
            <dd>{s.banco_nombre || "—"}</dd>
            <dt>Domicilio</dt>
            <dd>{domicilio || "—"}</dd>
          </dl>
        </Card>
      </div>

      {data.documentos.length ? (
        <Card
          title="Documentos personales"
          text={puedeSubir ? "Puedes actualizar los documentos vencidos o pendientes." : undefined}
        >
          <div className="cx-grid" style={{ gap: 10 }}>
            {data.documentos.map((doc, i) => {
              const est = ESTADO_DOC[doc.estado];
              return (
                <div key={doc.tipo} className="cx-doc">
                  <div>
                    <p className="cx-doc-name">
                      {i + 1}. {doc.nombre}
                    </p>
                    {doc.fecha_vigencia ? <p className="cx-doc-meta">Vigencia: {formatFecha(doc.fecha_vigencia)}</p> : null}
                  </div>
                  <div className="cx-doc-actions">
                    <span className={`cx-badge cx-badge-${est.tono}`}>{est.texto}</span>
                    {doc.documento_id ? (
                      <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => abrirDocumento(doc.documento_id!)}>
                        Ver
                      </button>
                    ) : null}
                    {puedeSubir && doc.estado !== "vigente" ? (
                      <>
                        <input
                          ref={(el) => {
                            inputs.current[doc.tipo] = el;
                          }}
                          type="file"
                          className="cx-file-input"
                          accept="application/pdf,image/jpeg,image/png"
                          onChange={(e) => subir(doc.tipo, e.target.files?.[0])}
                        />
                        <button
                          type="button"
                          className="cx-btn cx-btn-primary cx-btn-sm"
                          disabled={subiendo !== null}
                          onClick={() => inputs.current[doc.tipo]?.click()}
                        >
                          {subiendo === doc.tipo ? "Subiendo..." : doc.documento_id ? "Reemplazar" : "Subir"}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      <Card title="Tabla de pagos">
        <TablaAmortizacion filas={s.tabla} completa={s.detalle_completo} />
      </Card>
    </div>
  );
}
