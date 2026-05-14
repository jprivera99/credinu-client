"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import RecoverPasswordModal from "@/components/RecoverPasswordModal";
import RecoverSuccessModal from "@/components/RecoverSuccessModal";

export default function LoginPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Nuevo icono para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showRecoverSuccess, setShowRecoverSuccess] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginRequest({ usuario, password });
      localStorage.setItem("token", data.token);
      router.push("/dashboard/productos");
    } catch (loginError) {
      const message =
        loginError instanceof Error
          ? loginError.message
          : "No fue posible iniciar sesión";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-panel">
        <section className="login-copy">
          <p className="login-wordmark" aria-label="CredinU">
            <span className="login-wordmark-left">Credi</span>
            <span className="login-wordmark-right">nU</span>
          </p>
          <p>
            Accede con tu usuario para consultar productos, solicitudes y tus
            datos personales.
          </p>
        </section>

        <form className="login-form" onSubmit={handleLogin}>
          <h2 className="login-title">Iniciar sesión</h2>

          {error ? <p className="error-copy">{error}</p> : null}

          <label>
            <span>Usuario</span>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Tu usuario"
              autoComplete="username"
            />
          </label>

          <label>
            <span>Contraseña</span>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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

          <button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="login-register-copy">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="login-register-link">
              Regístrate
            </Link>
          </p>

          <p className="login-register-copy">
            ¿Olvidaste tu contraseña?{" "}
            <a
              className="login-register-link"
              onClick={() => setShowRecoverModal(true)}
            >
              Restablecer contraseña
            </a>
          </p>
        </form>
      </div>

      {showRecoverModal && (
        <RecoverPasswordModal
          onClose={() => setShowRecoverModal(false)}
          onSuccess={() => {
            setShowRecoverModal(false);
            setShowRecoverSuccess(true);
          }}
        />
      )}

      {showRecoverSuccess && (
        <RecoverSuccessModal onFinish={() => setShowRecoverSuccess(false)} />
      )}
    </div>
  );
}
