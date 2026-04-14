"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerRequest } from "@/lib/api";
import { PrivacyModal } from "@/components/PrivacyModal";
import { TermsModal } from "@/components/TermsModal";
import { TreatmentDataModal } from "@/components/TreatmentDataModal";

export default function RegisterPage() {

  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_nacimiento: "",
    sexo: "",
    rfc: "",
    curp: "",
    telefono: "",
    aviso_privacidad: false,
    tratamiento_datos: false,
    terminos_condiciones: false
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);
  const [openTermsModal, setOpenTermsModal] = useState(false);
  const [openTreatmentModal, setOpenTreatmentModal] = useState(false);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const calcularEdad = (fecha: string) => {
    if (!fecha) return 0;

    const hoy = new Date();
    const nacimiento = new Date(fecha);

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();

    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    setError("");

    if (!form.nombre) return setError("Nombre requerido");
    if (!form.apellido_paterno) return setError("Apellido paterno requerido");
    if (!form.apellido_materno) return setError("Apellido materno requerido");

    if (calcularEdad(form.fecha_nacimiento) < 18) {
      return setError("Debes ser mayor de edad");
    }

    if (form.telefono.length !== 10) {
      return setError("El teléfono debe tener 10 dígitos");
    }

    if (form.rfc.length !== 13) {
      return setError("RFC inválido (13 caracteres)");
    }

    if (!form.curp) {
      return setError("CURP requerido");
    }

    if (!form.terminos_condiciones) {
      return setError("Debes aceptar los términos");
    }

    if (!form.tratamiento_datos) {
      return setError("Debes de autorizar las políticas de tratamiento de datos personales");
    }

    if (!form.aviso_privacidad) {
      return setError("Debes de aceptar el Aviso de privacidad");
    }

    try {
      setLoading(true);

      await registerRequest(form);

      alert("Registro exitoso");
      router.push("/login");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-screen">
      <form onSubmit={handleSubmit} className="register-panel">
        <div className="register-header">
          <p className="register-wordmark" aria-label="CredinU">
            <span className="register-wordmark-left">Credi</span>
            <span className="register-wordmark-right">nU</span>
          </p>
          <p>Completa tus datos para comenzar</p>
        </div>

        {error ? <div className="register-error">{error}</div> : null}

        <div className="register-grid">
          <input
            name="email"
            placeholder="Correo electrónico"
            onChange={handleChange}
            className="register-input"
          />

          <input
            name="nombre"
            placeholder="Nombre(s)"
            onChange={handleChange}
            className="register-input"
          />

          <input
            name="apellido_paterno"
            placeholder="Apellido paterno"
            onChange={handleChange}
            className="register-input"
          />

          <input
            name="apellido_materno"
            placeholder="Apellido materno"
            onChange={handleChange}
            className="register-input"
          />

          <input
            name="fecha_nacimiento"
            type="date"
            onChange={handleChange}
            className="register-input"
          />

          <select name="sexo" onChange={handleChange} className="register-input">
            <option value="">Sexo</option>
            <option value="H">Hombre</option>
            <option value="M">Mujer</option>
          </select>

          <input
            name="telefono"
            placeholder="Teléfono"
            onChange={handleChange}
            className="register-input"
          />

          <input
            name="rfc"
            placeholder="RFC"
            onChange={handleChange}
            className="register-input"
          />

          <input
            name="curp"
            placeholder="CURP"
            onChange={handleChange}
            className="register-input register-span-2"
          />
        </div>

        <div className="register-checklist">
          <label className="register-terms">
            <input type="checkbox" name="terminos_condiciones" onChange={handleChange} />
            He leído y acepto los{" "}
            <button
              type="button"
              className="register-link register-link-button"
              onClick={() => setOpenTermsModal(true)}
            >
              Términos y Condiciones
            </button>
          </label>

          <label className="register-terms">
            <input type="checkbox" name="tratamiento_datos" onChange={handleChange} />
            He leído y acepto las{" "}
            <button
              type="button"
              className="register-link register-link-button"
              onClick={() => setOpenTreatmentModal(true)}
            >
              Políticas de Tratamiento de Datos Personales
            </button>
          </label>

          <label className="register-terms"> <input type="checkbox" name="aviso_privacidad" onChange={handleChange} /> He leído y acepto el{" "}
            <button type="button" className="register-link register-link-button" onClick={() => setOpenPrivacyModal(true)} > Aviso de Privacidad
            </button>
          </label>
        </div>

        <button type="submit" disabled={loading} className="register-submit">
          {loading ? "Registrando..." : "REGISTRAR"}
        </button>

        <p className="register-footer">
          ¿Ya tienes cuenta?{" "}
          <span className="register-link" onClick={() => router.push("/login")}>
            Inicia sesión
          </span>
        </p>
      </form>

      {openPrivacyModal ? (
        <PrivacyModal onClose={() => setOpenPrivacyModal(false)} />
      ) : null}

      {openTermsModal ? (
        <TermsModal onClose={() => setOpenTermsModal(false)} />
      ) : null}

      {openTreatmentModal ? (
        <TreatmentDataModal
          onClose={() => setOpenTreatmentModal(false)}
          onAccept={() =>
            setForm((prev) => ({
              ...prev,
              tratamiento_datos: true,
            }))
          }
        />
      ) : null}
    </div>
  );
}