"use client";

import { useState } from "react";
import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerRequest } from "@/lib/api";
import { calcularRFCRequest } from "@/lib/api";
import { PrivacyModal } from "@/components/PrivacyModal";
import { TermsModal } from "@/components/TermsModal";
import { TreatmentDataModal } from "@/components/TreatmentDataModal";
import { ConfirmDataModal } from "@/components/ConfirmDataModal";
import { SelectChannelModal } from "@/components/SelectChannelModal";
import { VerifyCodeModal } from "@/components/VerifyCodeModal";
import { SuccessRegisterModal } from "@/components/SuccessRegisterModal";
import { LoadingModal } from "@/components/LoadingModal";
import { FinalRegisterModal } from "@/components/FinalRegisterModal";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_nacimiento: "",
    sexo: "",
    estado_nacimiento: "",
    rfc: "",
    curp: "",
    telefono: "",
    aviso_privacidad: false,
    tratamiento_datos: false,
    terminos_condiciones: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);
  const [openTermsModal, setOpenTermsModal] = useState(false);
  const [openTreatmentModal, setOpenTreatmentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const timeoutRef = useRef(null);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
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

  const generarRFCPreview = async () => {
    const { nombre, apellido_paterno, apellido_materno, fecha_nacimiento } =
      form;

    if (!nombre || !apellido_paterno || !apellido_materno || !fecha_nacimiento)
      return;

    try {
      const data = await calcularRFCRequest({
        nombre,
        apellido_paterno,
        apellido_materno,
        fecha_nacimiento,
      });

      console.log("RFC recibido:", data);

      if (!data?.rfc) return;

      setForm((prev) => ({
        ...prev,
        rfc: data.rfc,
      }));
    } catch (err) {
      console.error("Error RFC:", err);
    }
  };
  

  useEffect(() => {
    const { nombre, apellido_paterno, apellido_materno, fecha_nacimiento } =
      form;

    if (!nombre || !apellido_paterno || !apellido_materno || !fecha_nacimiento)
      return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      generarRFCPreview();
    }, 600);

    return () => clearTimeout(timeoutRef.current);
  }, [
    form.nombre,
    form.apellido_paterno,
    form.apellido_materno,
    form.fecha_nacimiento,
  ]);

  //--------------------------------- LOGICA DE REGISTRO ------------------

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

    if (!form.rfc) {
      return setError("RFC requerido");
    }

    if (!form.curp) {
      return setError("CURP requerido");
    }

    if (!form.terminos_condiciones) {
      return setError("Debes aceptar los términos");
    }

    if (!form.tratamiento_datos) {
      return setError(
        "Debes de autorizar las políticas de tratamiento de datos personales",
      );
    }

    if (!form.aviso_privacidad) {
      return setError("Debes de aceptar el Aviso de privacidad");
    }

    setShowConfirmModal(true);
  };

  const handleConfirmRegister = () => {
    setShowConfirmModal(false);
    setShowChannelModal(true);
  };

  const handleSelectChannel = async (method: "sms" | "whatsapp") => {
    try {
      setLoading(true);
      console.log("Enviar código vía:", method);

      // Simulación
      alert(`Código enviado por ${method.toUpperCase()}`);

      setShowChannelModal(false);
      setShowVerifyModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (codigo: string) => {
    try {
      setLoading(true);
      setError("");

      if (codigo !== "123456") {
        throw new Error("Código incorrecto");
      }

      setShowVerifyModal(false);

      setTimeout(() => {
        setShowSuccessModal(true);
      }, 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      console.log("Reenviando código...");

      alert("Código reenviado");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFinishSuccess = async () => {
    setShowSuccessModal(false);
    setShowLoadingModal(true);

    try {
      await registerRequest(form);

      setShowLoadingModal(false);

      setShowFinalModal(true);
    } catch (err: any) {
      setError(err.message);
      setShowLoadingModal(false);
    }
  };

  const handleFinishFinal = () => {
    setShowFinalModal(false);
    router.push("/login");
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

          <select
            name="sexo"
            onChange={handleChange}
            className="register-input"
          >
            <option value="">Sexo</option>
            <option value="H">Hombre</option>
            <option value="M">Mujer</option>
          </select>

          <select
            name="estado_nacimiento"
            onChange={handleChange}
            className="register-input register-span-2"
          >
            <option value="">Estado de nacimiento</option>
            <option value="AGS">Aguascalientes</option>
            <option value="BC">Baja California</option>
            <option value="BCS">Baja California Sur</option>
            <option value="CAM">Campeche</option>
            <option value="CHIS">Chiapas</option>
            <option value="CHIH">Chihuahua</option>
            <option value="CDMX">Ciudad de México</option>
            <option value="COAH">Coahuila</option>
            <option value="COL">Colima</option>
            <option value="DGO">Durango</option>
            <option value="GTO">Guanajuato</option>
            <option value="GRO">Guerrero</option>
            <option value="HGO">Hidalgo</option>
            <option value="JAL">Jalisco</option>
            <option value="MEX">Estado de México</option>
            <option value="MICH">Michoacán</option>
            <option value="MOR">Morelos</option>
            <option value="NAY">Nayarit</option>
            <option value="NL">Nuevo León</option>
            <option value="OAX">Oaxaca</option>
            <option value="PUE">Puebla</option>
            <option value="QRO">Querétaro</option>
            <option value="QROO">Quintana Roo</option>
            <option value="SLP">San Luis Potosí</option>
            <option value="SIN">Sinaloa</option>
            <option value="SON">Sonora</option>
            <option value="TAB">Tabasco</option>
            <option value="TAMS">Tamaulipas</option>
            <option value="TLAX">Tlaxcala</option>
            <option value="VER">Veracruz</option>
            <option value="YUC">Yucatán</option>
            <option value="ZAC">Zacatecas</option>
            <option value="EXT">Extranjero</option>
          </select>

          <input
            name="telefono"
            placeholder="Teléfono"
            onChange={handleChange}
            className="register-input"
          />

          <input
            name="rfc"
            value={form.rfc}
            readOnly
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
            <input
              type="checkbox"
              name="terminos_condiciones"
              onChange={handleChange}
            />
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
            <input
              type="checkbox"
              name="tratamiento_datos"
              onChange={handleChange}
            />
            He leído y acepto las{" "}
            <button
              type="button"
              className="register-link register-link-button"
              onClick={() => setOpenTreatmentModal(true)}
            >
              Políticas de Tratamiento de Datos Personales
            </button>
          </label>

          <label className="register-terms">
            {" "}
            <input
              type="checkbox"
              name="aviso_privacidad"
              onChange={handleChange}
            />{" "}
            He leído y acepto el{" "}
            <button
              type="button"
              className="register-link register-link-button"
              onClick={() => setOpenPrivacyModal(true)}
            >
              {" "}
              Aviso de Privacidad
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

      {showConfirmModal && (
        <ConfirmDataModal
          rfc={form.rfc}
          curp={form.curp}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmRegister}
        />
      )}

      {showChannelModal && (
        <SelectChannelModal
          onClose={() => setShowChannelModal(false)}
          onSelect={handleSelectChannel}
        />
      )}

      {showVerifyModal && (
        <VerifyCodeModal
          telefono={form.telefono}
          onVerify={handleVerifyCode}
          onResend={handleResendCode}
          onClose={() => setShowVerifyModal(false)}
          error={error}
        />
      )}

      {showSuccessModal && (
        <SuccessRegisterModal onFinish={handleFinishSuccess} />
      )}

      {showLoadingModal && <LoadingModal />}

      {showFinalModal && <FinalRegisterModal onFinish={handleFinishFinal} />}
    </div>
  );
}
