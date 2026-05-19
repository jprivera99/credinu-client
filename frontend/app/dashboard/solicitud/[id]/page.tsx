// app/dashboard/solicitud/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  getApplicationRequest,
  updateApplicationRequest,
  finalizeApplicationRequest,
} from "@/lib/api";

/*
| TYPES
*/

interface Cliente {
  nombre?: string;

  apellido_paterno?: string;

  apellido_materno?: string;

  telefono_movil?: string;

  email?: string;

  curp?: string;

  rfc?: string;

  fecha_nacimiento?: string;
}

interface Domicilio {
  calle?: string;

  numero_exterior?: string;

  numero_interior?: string;

  colonia?: string;

  municipio?: string;

  estado?: string;

  codigo_postal?: string;
}

interface Solicitud {
  monto_credito?: number;

  plazo_meses?: number;

  monto_pago?: number;

  monto_total?: number;

  producto?: string;
}

interface PrestamoExpressResponse {
  current_step?: number;

  cliente?: Cliente;

  domicilio?: Domicilio;

  solicitud?: Solicitud;
}

/*
| COMPONENT
*/

export default function PrestamoExpressPage() {
  const params = useParams();

  const id = Number(params.id);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<PrestamoExpressResponse | null>(null);

  const [step, setStep] = useState(1);

  /*
  | FORM STATES
  */

  const [cliente, setCliente] = useState<Cliente>({});

  const [domicilio, setDomicilio] = useState<Domicilio>({});

  /*
  | FETCH
  */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await getApplicationRequest(id);

        setData(response);

        /*
        | STEP
        */

        if (response?.current_step) {
          setStep(response.current_step);
        }

        /*
        | SET FORMS
        */

        setCliente(response?.cliente || {});

        setDomicilio(response?.domicilio || {});
      } catch (error) {
        console.error("ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  /*
  | SAVE
  */

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateApplicationRequest(id, {
        current_step: step,

        cliente,

        domicilio,
      });

      return true;
    } catch (error) {
      console.error("ERROR GUARDAR:", error);

      return false;
    } finally {
      setSaving(false);
    }
  };

  /*
  | NEXT STEP
  */

  const handleNext = async () => {
    const saved = await handleSave();

    if (!saved) {
      return;
    }

    setStep((prev) => (prev < 6 ? prev + 1 : prev));
  };

  const handleFinalize = async () => {
    try {
      setSaving(true);

      /*
    | GUARDAR ULTIMA INFO
    */

      await updateApplicationRequest(id, {
        current_step: step,

        cliente,

        domicilio,
      });

      /*
    | FINALIZAR
    */

      const response = await finalizeApplicationRequest(id);

      console.log("FINALIZADO:", response);

      alert("Solicitud finalizada correctamente");

      /*
    | OPCIONAL
    */

      setStep(6);
    } catch (error) {
      console.error("ERROR FINALIZAR:", error);

      alert("Error al finalizar solicitud");
    } finally {
      setSaving(false);
    }
  };

  /*
  | PREVIOUS STEP
  */

  const handleBack = () => {
    setStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  /*
  | LOADING
  */

  if (loading) {
    return (
      <section className="auth-wrapper">
        <div className="auth-card">
          <p>Cargando información...</p>
        </div>
      </section>
    );
  }

  /*
  | EMPTY
  */

  if (!data) {
    return (
      <section className="auth-wrapper">
        <div className="auth-card">
          <p>Solicitud no encontrada</p>
        </div>
      </section>
    );
  }

  /*
  | PROGRESS %
  */

  const progress = (step / 6) * 100;

  return (
    <section className="auth-wrapper">
      <div
        className="auth-card"
        style={{
          maxWidth: "850px",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              fontSize: "30px",
              fontWeight: 700,
            }}
          >
            Solicitud de crédito
          </h1>

          <p
            style={{
              marginTop: "10px",
              opacity: 0.7,
            }}
          >
            Verifica y completa tu información para continuar con tu solicitud.
          </p>
        </div>

        {/* PROGRESS */}

        <div
          style={{
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontWeight: 600,
              }}
            >
              Paso {step} de 6
            </span>

            <span>{Math.round(progress)}%</span>
          </div>

          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#E5E7EB",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#2563EB",
                transition: "0.3s",
              }}
            />
          </div>
        </div>

        {/* STEP 1 */}

        {step === 1 && (
          <>
            <div
              style={{
                marginBottom: "30px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                }}
              >
                Verifica tu información personal
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  opacity: 0.7,
                }}
              >
                Antes de continuar valida que tus datos sean correctos.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))",
                gap: "20px",
              }}
            >
              <div>
                <label className="form-label">Nombre</label>

                <input
                  className="form-input"
                  value={cliente.nombre || ""}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      nombre: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Apellido paterno</label>

                <input
                  className="form-input"
                  value={cliente.apellido_paterno || ""}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      apellido_paterno: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Apellido materno</label>

                <input
                  className="form-input"
                  value={cliente.apellido_materno || ""}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      apellido_materno: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">CURP</label>

                <input
                  className="form-input"
                  value={cliente.curp || ""}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      curp: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">RFC</label>

                <input
                  className="form-input"
                  value={cliente.rfc || ""}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      rfc: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Teléfono</label>

                <input
                  className="form-input"
                  value={cliente.telefono_movil || ""}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      telefono_movil: e.target.value,
                    })
                  }
                />
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                }}
              >
                <label className="form-label">Correo electrónico</label>

                <input
                  className="form-input"
                  value={cliente.email || ""}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      email: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </>
        )}

        {/* STEP 2 */}

        {step === 2 && (
          <>
            <div
              style={{
                marginBottom: "30px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                }}
              >
                Domicilio
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  opacity: 0.7,
                }}
              >
                Verifica la información de tu domicilio.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))",
                gap: "20px",
              }}
            >
              <div>
                <label className="form-label">Calle</label>

                <input
                  className="form-input"
                  value={domicilio.calle || ""}
                  onChange={(e) =>
                    setDomicilio({
                      ...domicilio,
                      calle: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Número exterior</label>

                <input
                  className="form-input"
                  value={domicilio.numero_exterior || ""}
                  onChange={(e) =>
                    setDomicilio({
                      ...domicilio,
                      numero_exterior: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Número interior</label>

                <input
                  className="form-input"
                  value={domicilio.numero_interior || ""}
                  onChange={(e) =>
                    setDomicilio({
                      ...domicilio,
                      numero_interior: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Colonia</label>

                <input
                  className="form-input"
                  value={domicilio.colonia || ""}
                  onChange={(e) =>
                    setDomicilio({
                      ...domicilio,
                      colonia: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Municipio</label>

                <input
                  className="form-input"
                  value={domicilio.municipio || ""}
                  onChange={(e) =>
                    setDomicilio({
                      ...domicilio,
                      municipio: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Estado</label>

                <input
                  className="form-input"
                  value={domicilio.estado || ""}
                  onChange={(e) =>
                    setDomicilio({
                      ...domicilio,
                      estado: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Código postal</label>

                <input
                  className="form-input"
                  value={domicilio.codigo_postal || ""}
                  onChange={(e) =>
                    setDomicilio({
                      ...domicilio,
                      codigo_postal: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </>
        )}

        {/* STEP 3 */}

        {step === 3 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              Información laboral
            </h2>

            <p
              style={{
                marginTop: "15px",
                opacity: 0.7,
              }}
            >
              Próximamente...
            </p>
          </div>
        )}

        {/* STEP 4 */}

        {step === 4 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              Referencias
            </h2>

            <p
              style={{
                marginTop: "15px",
                opacity: 0.7,
              }}
            >
              Próximamente...
            </p>
          </div>
        )}

        {/* STEP 5 */}

        {step === 5 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              Documentos
            </h2>

            <p
              style={{
                marginTop: "15px",
                opacity: 0.7,
              }}
            >
              Próximamente...
            </p>
          </div>
        )}

        {/* STEP 6 */}

        {step === 6 && (
          <>
            <div
              style={{
                marginBottom: "30px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                }}
              >
                Confirmación
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  opacity: 0.7,
                }}
              >
                Revisa la información de tu solicitud.
              </p>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <p>Producto</p>

                <h3>{data.solicitud?.producto}</h3>
              </div>

              <div className="summary-card">
                <p>Monto solicitado</p>

                <h3>
                  $
                  {Number(data.solicitud?.monto_credito || 0).toLocaleString(
                    "es-MX",
                  )}
                </h3>
              </div>

              <div className="summary-card">
                <p>Pago mensual</p>

                <h3>
                  $
                  {Number(data.solicitud?.monto_pago || 0).toLocaleString(
                    "es-MX",
                  )}
                </h3>
              </div>

              <div className="summary-card">
                <p>Total a pagar</p>

                <h3>
                  $
                  {Number(data.solicitud?.monto_total || 0).toLocaleString(
                    "es-MX",
                  )}
                </h3>
              </div>
            </div>
          </>
        )}

        {/* FOOTER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "40px",
            gap: "15px",
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            disabled={step === 1}
            onClick={handleBack}
          >
            Regresar
          </button>

          <button
            type="button"
            className="btn-primary"
            disabled={saving}
            onClick={step === 6 ? handleFinalize : handleNext}
          >
            {saving
              ? step === 6
                ? "Finalizando..."
                : "Guardando..."
              : step === 6
                ? "Finalizar solicitud"
                : "Guardar y continuar"}
          </button>
        </div>
      </div>
    </section>
  );
}
