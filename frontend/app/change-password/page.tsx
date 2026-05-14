"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { changePasswordRequest } from "@/lib/api";
import { useState } from "react";
import { SuccessPasswordModal } from "@/components/SuccessPasswordModal";

export default function CambiarPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const passwordRules = [
    {
      label: "Entre 8 y 16 caracteres",
      valid: password.length >= 8 && password.length <= 16,
    },
    {
      label: "Al menos una mayúscula",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "Al menos una minúscula",
      valid: /[a-z]/.test(password),
    },
    {
      label: "Al menos un número",
      valid: /\d/.test(password),
    },
    {
      label: "Al menos un signo (ej. !@#$%)",
      valid: /[^A-Za-z0-9]/.test(password),
    },
    {
      label: "Las contraseñas coinciden",
      valid: password && confirm && password === confirm,
    },
  ];

  // VALIDACIÓN COMPLETA
  const validatePassword = () => {
    const newErrors: string[] = [];

    if (!password || !confirm) {
      newErrors.push("Debes ingresar y confirmar la contraseña");
      return newErrors;
    }

    if (password.length < 8 || password.length > 16) {
      newErrors.push("Debe tener entre 8 y 16 caracteres");
    }

    if (!/[A-Z]/.test(password)) {
      newErrors.push("Debe incluir al menos una mayúscula");
    }

    if (!/[a-z]/.test(password)) {
      newErrors.push("Debe incluir al menos una minúscula");
    }

    if (!/\d/.test(password)) {
      newErrors.push("Debe incluir al menos un número");
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.push("Debe incluir al menos un signo (ej. !@#$%)");
    }

    if (password !== confirm) {
      newErrors.push("Las contraseñas no coinciden");
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // IMPORTANTE
    if (loading) return;

    setErrors([]);

    if (!token) {
      return setErrors(["El enlace no es válido o ha expirado"]);
    }

    const validationErrors = validatePassword();

    if (validationErrors.length > 0) {
      return setErrors(validationErrors);
    }

    try {
      setLoading(true);

      await changePasswordRequest({
        token,
        newPassword: password,
      });

      setShowSuccessModal(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors([err.message]);
      } else {
        setErrors(["Error al cambiar la contraseña"]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setShowSuccessModal(false);
    router.push("/login");
  };

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Enlace inválido</h2>
        <p>El enlace ha expirado o no es válido.</p>

        <button onClick={() => router.push("/login")}>Ir a login</button>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-panel">
        <section className="login-copy">
          <p className="login-wordmark">
            <span className="login-wordmark-left">Credi</span>
            <span className="login-wordmark-right">nU</span>
          </p>
          <p>
            Cambiar tu contraseña es fácil. Solo ingresa tu nueva contraseña y
            confírmala para mantener tu cuenta segura.
          </p>
        </section>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">Cambio de contraseña</h2>

          {/* ERRORES */}
          {errors.length > 0 && (
            <div style={{ color: "red", marginBottom: 10 }}>
              <ul style={{ paddingLeft: 18 }}>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <label>
            <span>Nueva contraseña</span>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                disabled={loading}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" fill="#000" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" fill="#000" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <label>
            <span>Confirmar contraseña</span>
            <div className="password-input-wrapper">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
                disabled={loading}
              >
                {showConfirm ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" fill="#000" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" fill="#000" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <div style={{ marginTop: 10, fontSize: 13 }}>
            {passwordRules.map((rule, i) => (
              <div
                key={i}
                style={{
                  color: rule.valid ? "green" : "#999",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{rule.valid ? "✔" : "○"}</span>
                {rule.label}
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading || !password || !confirm}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </div>
      {showSuccessModal && <SuccessPasswordModal onFinish={handleFinish} />}
    </div>
  );
}
