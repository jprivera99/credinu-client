"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { changePasswordRequest } from "@/lib/api";
import { useState } from "react";
import { SuccessPasswordModal } from "@/components/SuccessPasswordModal";

export default function CambiarPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("key");

  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] =
    useState<boolean>(false);

  const handleSubmit = async () => {
    if (loading) return;

    setError("");

    if (!token) {
      return setError("El enlace no es válido o ha expirado");
    }

    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}$/;

    if (!regex.test(password)) {
      return setError(
        "La contraseña debe tener entre 8 y 16 caracteres, incluir mayúsculas, minúsculas y números",
      );
    }

    if (password !== confirm) {
      return setError("Las contraseñas no coinciden");
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
        setError(err.message);
      } else {
        setError("Error al cambiar la contraseña");
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

        <button onClick={() => router.push("/login")}>
          Ir a login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
      <h2>Cambiar contraseña</h2>

      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          {error}
        </div>
      )}

      <input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        style={{ display: "block", marginBottom: 10, width: "100%" }}
      />

      <input
        type="password"
        placeholder="Confirmar contraseña"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={loading}
        style={{ display: "block", marginBottom: 10, width: "100%" }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !password || !confirm}
        style={{ width: "100%" }}
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
      
      {showSuccessModal && (
        <SuccessPasswordModal onFinish={handleFinish} />
      )}
    </div>
  );
}