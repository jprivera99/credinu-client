"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { completeApplicationRequest } from "@/lib/api";
import { formatFolio } from "@/lib/solicitud";
import { Loading, errorMessage } from "@/components/portal/ui";

type Estado = "procesando" | "enviada" | "ya_procesada" | "reintentar" | "callcenter" | "error";

function FinalizadoContent() {
  const params = useParams();
  const search = useSearchParams();
  const id = Number(params.id);

  const [estado, setEstado] = useState<Estado>("procesando");
  const [urlReintento, setUrlReintento] = useState("");
  const [mensaje, setMensaje] = useState("");
  const ejecutado = useRef(false);

  useEffect(() => {
    // Evita procesar dos veces el regreso de REM (React en desarrollo ejecuta los efectos dos veces).
    if (ejecutado.current) return;
    ejecutado.current = true;

    if (search.get("estado") === "enviada") {
      setEstado("enviada");
      return;
    }

    completeApplicationRequest(id, {
      workflow: search.get("workflow"),
      workflow_status: search.get("workflow_status"),
      last_step: search.get("last_step"),
    })
      .then((r) => {
        if (r.estado === "reintentar" && r.public_url) {
          setUrlReintento(r.public_url);
          setEstado("reintentar");
        } else if (r.estado === "callcenter") {
          setEstado("callcenter");
        } else if (r.estado === "ya_procesada") {
          setEstado("ya_procesada");
        } else {
          setEstado("enviada");
        }
      })
      .catch((err) => {
        setMensaje(errorMessage(err));
        setEstado("error");
      });
  }, [id, search]);

  if (estado === "procesando") return <Loading text="Estamos registrando tu solicitud, no cierres esta ventana..." />;

  const contenido: Record<Exclude<Estado, "procesando">, { icono: string; color: string; titulo: string; texto: string }> = {
    enviada: {
      icono: "✓",
      color: "var(--cx-green)",
      titulo: "¡Tu solicitud fue enviada!",
      texto:
        "La revisaremos y te avisaremos por correo electrónico. Puedes consultar el avance en Solicitudes de Crédito.",
    },
    ya_procesada: {
      icono: "✓",
      color: "var(--cx-primary)",
      titulo: "Tu solicitud ya está en proceso",
      texto: "Esta solicitud ya había sido registrada. Consulta su estatus en Solicitudes de Crédito.",
    },
    reintentar: {
      icono: "!",
      color: "var(--cx-amber)",
      titulo: "No pudimos validar tu identificación",
      texto:
        "La captura de tu INE no se completó. Intenta de nuevo: usa buena iluminación, coloca la credencial sobre una superficie lisa y evita reflejos.",
    },
    callcenter: {
      icono: "!",
      color: "var(--cx-red)",
      titulo: "Necesitamos ayudarte",
      texto:
        "No fue posible validar tu identificación después de varios intentos. Comunícate con nuestro centro de atención para concluir tu solicitud.",
    },
    error: {
      icono: "!",
      color: "var(--cx-red)",
      titulo: "Algo salió mal",
      texto: mensaje || "No fue posible confirmar tu solicitud. Revisa su estatus o intenta de nuevo.",
    },
  };

  const c = contenido[estado];

  return (
    <div className="cx-page" style={{ maxWidth: 640, margin: "24px auto 0" }}>
      <div className="cx-card" style={{ textAlign: "center", padding: "40px 28px" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            margin: "0 auto 18px",
            display: "grid",
            placeItems: "center",
            background: c.color,
            color: "#fff",
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          {c.icono}
        </div>
        <p className="cx-eyebrow">Solicitud {formatFolio(id)}</p>
        <h2 className="cx-title">{c.titulo}</h2>
        <p className="cx-subtitle" style={{ maxWidth: 480, margin: "10px auto 0" }}>
          {c.texto}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
          {estado === "reintentar" ? (
            <a href={urlReintento} className="cx-btn cx-btn-primary">
              Volver a intentar
            </a>
          ) : null}
          {estado === "error" ? (
            <Link href={`/dashboard/solicitud/${id}`} className="cx-btn cx-btn-primary">
              Regresar a la solicitud
            </Link>
          ) : null}
          <Link
            href="/dashboard/mis-solicitudes"
            className={`cx-btn ${estado === "enviada" || estado === "ya_procesada" ? "cx-btn-primary" : "cx-btn-secondary"}`}
          >
            Ir a mis solicitudes
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FinalizadoPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FinalizadoContent />
    </Suspense>
  );
}
