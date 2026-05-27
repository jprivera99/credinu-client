// app/dashboard/solicitud/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  getApplicationRequest,
  updateApplicationRequest,
  finalizeApplicationRequest,
} from "@/lib/api";

import type {
  Cliente,
  Domicilio,
  Laboral,
  Referencia,
  RedesSociales,
  PrestamoExpressResponse,
} from "@/lib/types";

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

  const [laboral, setLaboral] = useState<Laboral>({});

  const [referencias, setReferencias] = useState<Referencia[]>([
    {
      nombre: "",
      telefono: "",
      parentesco: "",
    },
  ]);

  const [redes, setRedes] = useState<RedesSociales>({});

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

        setLaboral(response?.laboral || {});
        setReferencias(
          response?.referencias?.length
            ? response.referencias
            : [
                {
                  nombre: "",
                  telefono: "",
                  parentesco: "",
                },
              ],
        );

        setRedes(response?.redes_sociales || {});
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

        laboral,

        referencias,

        redes_sociales: redes,
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

        laboral,

        referencias,

        redes_sociales: redes,
      });

      /*
    | FINALIZAR
    */

      const response = await finalizeApplicationRequest(id);

      console.log("FINALIZADO:", response);

      /*
    | REDIRECCIONAR REM
    */

      if (response?.public_url) {
        window.location.href = response.public_url;

        return;
      }

      /*
    | FALLBACK
    */

      alert("Solicitud finalizada correctamente");

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
                Información laboral
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  opacity: 0.7,
                }}
              >
                Verifica tu información laboral.
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
                <label className="form-label">Puesto</label>

                <input
                  className="form-input"
                  value={laboral.puesto || ""}
                  onChange={(e) =>
                    setLaboral({
                      ...laboral,
                      puesto: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Ingreso mensual</label>

                <input
                  type="number"
                  className="form-input"
                  value={laboral.ingreso_mensual || ""}
                  onChange={(e) =>
                    setLaboral({
                      ...laboral,
                      ingreso_mensual: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Antigüedad</label>

                <input
                  type="number"
                  className="form-input"
                  value={laboral.antiguedad || ""}
                  onChange={(e) =>
                    setLaboral({
                      ...laboral,
                      antiguedad: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </>
        )}

        {/* STEP 4 */}

        {step === 4 && (
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
                Referencias personales
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  opacity: 0.7,
                }}
              >
                Agrega tus referencias.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: "20px",
              }}
            >
              {referencias.map((ref, index) => (
                <div key={index} className="product-card">
                  <h4
                    style={{
                      marginBottom: "15px",
                    }}
                  >
                    Referencia {index + 1}
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px,1fr))",
                      gap: "15px",
                    }}
                  >
                    <div>
                      <label className="form-label">Nombre</label>

                      <input
                        className="form-input"
                        value={ref.nombre || ""}
                        onChange={(e) => {
                          const copy = [...referencias];

                          copy[index].nombre = e.target.value;

                          setReferencias(copy);
                        }}
                      />
                    </div>

                    <div>
                      <label className="form-label">Teléfono</label>

                      <input
                        className="form-input"
                        value={ref.telefono || ""}
                        onChange={(e) => {
                          const copy = [...referencias];

                          copy[index].telefono = e.target.value;

                          setReferencias(copy);
                        }}
                      />
                    </div>

                    <div>
                      <label className="form-label">Parentesco</label>

                      <input
                        className="form-input"
                        value={ref.parentesco || ""}
                        onChange={(e) => {
                          const copy = [...referencias];

                          copy[index].parentesco = e.target.value;

                          setReferencias(copy);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setReferencias([
                    ...referencias,
                    {
                      nombre: "",
                      telefono: "",
                      parentesco: "",
                    },
                  ])
                }
              >
                Agregar referencia
              </button>
            </div>
          </>
        )}

        {/* STEP 5 */}

        {step === 5 && (
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
                Redes sociales y documentos
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  opacity: 0.7,
                }}
              >
                Completa la información.
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
                <label className="form-label">Facebook</label>

                <input
                  className="form-input"
                  value={redes.facebook || ""}
                  onChange={(e) =>
                    setRedes({
                      ...redes,
                      facebook: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Instagram</label>

                <input
                  className="form-input"
                  value={redes.instagram || ""}
                  onChange={(e) =>
                    setRedes({
                      ...redes,
                      instagram: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">TikTok</label>

                <input
                  className="form-input"
                  value={redes.tiktok || ""}
                  onChange={(e) =>
                    setRedes({
                      ...redes,
                      tiktok: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">LinkedIn</label>

                <input
                  className="form-input"
                  value={redes.linkedin || ""}
                  onChange={(e) =>
                    setRedes({
                      ...redes,
                      linkedin: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "35px",
              }}
            >
              <h3
                style={{
                  marginBottom: "20px",
                }}
              >
                Documentos
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
                  gap: "20px",
                }}
              >
                <div className="upload-box">
                  <p>INE frontal</p>

                  <input type="file" />
                </div>

                <div className="upload-box">
                  <p>INE reverso</p>

                  <input type="file" />
                </div>

                <div className="upload-box">
                  <p>Comprobante domicilio</p>

                  <input type="file" />
                </div>
              </div>
            </div>
          </>
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
              ? "Guardando..."
              : step === 6
                ? "Finalizar"
                : "Guardar y continuar"}
          </button>
        </div>
      </div>
    </section>
  );
}
