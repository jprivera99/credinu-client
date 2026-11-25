"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getApplicationRequest, getSolicitudCatalogs } from "@/lib/api";
import type { CatalogosSolicitud, PasoClave, SolicitudDetalle } from "@/lib/solicitud";
import { PASO_TITULOS, formatFolio, formatMoney, pagosLabel } from "@/lib/solicitud";
import { Alert, Loading, PageHeader, errorMessage } from "@/components/portal/ui";
import {
  PasoBuro,
  PasoClabe,
  PasoContrato,
  PasoDatosGenerales,
  PasoDocumentos,
  PasoDomicilio,
  PasoEnviar,
  PasoReferencias,
  PasoRedes,
  type PasoProps,
} from "@/components/solicitud/Pasos";

const COMPONENTES: Record<Exclude<PasoClave, "enviar">, (p: PasoProps) => React.ReactElement> = {
  domicilio: PasoDomicilio,
  datos_generales: PasoDatosGenerales,
  referencias: PasoReferencias,
  redes_sociales: PasoRedes,
  contrato: PasoContrato,
  clabe: PasoClabe,
  documentos: PasoDocumentos,
  buro: PasoBuro,
};

export default function SolicitudPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [data, setData] = useState<SolicitudDetalle | null>(null);
  const [catalogos, setCatalogos] = useState<CatalogosSolicitud | null>(null);
  const [indice, setIndice] = useState(0);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    const res = await getApplicationRequest(id);
    setData(res);
    return res;
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await cargar();
        if (!res.solicitud.editable) {
          router.replace(`/dashboard/solicitud/${id}/expediente`);
          return;
        }
        // Retoma en el primer paso incompleto.
        const primero = res.pasos.findIndex((p) => !p.completo);
        setIndice(primero >= 0 ? primero : res.pasos.length - 1);
        setCatalogos(await getSolicitudCatalogs(res.solicitud.tipo_producto));
      } catch (err) {
        setError(errorMessage(err, "No fue posible cargar la solicitud"));
      }
    })();
  }, [cargar, id, router]);

  const irA = (i: number) => {
    setIndice(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="cx-page">
        <Alert tone="error">{error}</Alert>
        <Link href="/dashboard/mis-solicitudes" className="cx-btn cx-btn-secondary" style={{ alignSelf: "flex-start" }}>
          Regresar a mis solicitudes
        </Link>
      </div>
    );
  }

  if (!data) return <Loading text="Cargando tu solicitud..." />;

  const pasos = data.pasos;
  const actual = pasos[indice];
  const completos = pasos.filter((p) => p.completo).length;
  const progreso = Math.round((completos / Math.max(pasos.length - 1, 1)) * 100);

  const props: PasoProps = {
    id,
    data,
    catalogos,
    onBack: indice > 0 ? () => irA(indice - 1) : undefined,
    onRefresh: async () => {
      await cargar();
    },
    onSaved: async () => {
      await cargar();
      irA(Math.min(indice + 1, pasos.length - 1));
    },
  };

  const Componente = actual.clave !== "enviar" ? COMPONENTES[actual.clave] : null;

  return (
    <div className="cx-page">
      <PageHeader
        eyebrow={`Solicitud ${formatFolio(id)}${data.solicitud.express ? " · Express" : ""}`}
        title={data.solicitud.producto || "Solicitud de crédito"}
        subtitle={
          <>
            {formatMoney(data.solicitud.monto_credito)} en {data.solicitud.total_pagos} pagos{" "}
            {pagosLabel(data.solicitud.periodicidad)} de {formatMoney(data.solicitud.monto_pago)}
          </>
        }
        actions={
          <Link href="/dashboard/mis-solicitudes" className="cx-btn cx-btn-secondary">
            Guardar y salir
          </Link>
        }
      />

      <div className="cx-card" style={{ paddingBottom: 18 }}>
        <div className="cx-steps">
          {pasos.map((p, i) => {
            const estado = i === indice ? "is-current" : p.completo ? "is-done" : "";
            return (
              <button key={p.clave} type="button" className={`cx-step ${estado}`} onClick={() => irA(i)}>
                <span className="cx-step-dot">{p.completo && i !== indice ? "✓" : i + 1}</span>
                <span className="cx-step-label">{PASO_TITULOS[p.clave]}</span>
              </button>
            );
          })}
        </div>
        <div className="cx-progress" aria-label={`Avance ${progreso}%`}>
          <span style={{ width: `${Math.min(progreso, 100)}%` }} />
        </div>
      </div>

      {Componente ? (
        <Componente key={actual.clave} {...props} />
      ) : (
        <PasoEnviar
          {...props}
          onEnviada={() => router.replace(`/dashboard/solicitud/${id}/finalizado?estado=enviada`)}
        />
      )}
    </div>
  );
}
