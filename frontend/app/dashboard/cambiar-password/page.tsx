"use client";

import { useEffect, useState } from "react";
import { changePassword } from "@/lib/api";

export default function CambiarPasswordPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const hasMinLength = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);
    const hasSign = /[^A-Za-z0-9]/.test(newPassword);
    const matches = newPassword.length > 0 && newPassword === confirmPassword;

    const validateForm = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            return "Completa todos los campos";
        }

        if (!hasMinLength || !hasNumber || !hasSign) {
            return "La nueva contraseña debe tener minimo 8 caracteres, un numero y un signo";
        }

        if (!matches) {
            return "La confirmacion de contraseña no coincide";
        }

        return "";
    };

    useEffect(() => {
        if (!message && !error) return;

        const timeoutId = window.setTimeout(() => {
            setMessage("");
            setError("");
        }, 10000);

        return () => window.clearTimeout(timeoutId);
    }, [message, error]);

    const submitPasswordChange = async () => {
        try {
            setSaving(true);
            setShowConfirmModal(false);

            await changePassword({ currentPassword, newPassword });
            setMessage("Contraseña actualizada correctamente");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (submitError) {
            const msg =
                submitError instanceof Error
                    ? submitError.message
                    : "No fue posible actualizar la contraseña";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const validationMessage = validateForm();

        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        setShowConfirmModal(true);
    };

    return (
        <section className="portal-stack">
            <div className="section-header">
                <div>
                    <p className="hero-kicker">Seguridad</p>
                    <h2>Cambiar Contraseña</h2>
                </div>
            </div>

            <form className="form-card form-card-narrow" onSubmit={handleSubmit}>
                <label>
                    <span>Contraseña actual</span>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={saving}
                    />
                </label>

                <label>
                    <span>Nueva contraseña</span>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={saving}
                    />
                </label>

                <label>
                    <span>Confirmar nueva contraseña</span>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={saving}
                    />
                </label>

                <div className="password-rules">
                    <div className={hasMinLength ? "is-valid" : ""}>
                        <span className="rule-icon">{hasMinLength ? "✔" : "○"}</span>
                        Mínimo 8 caracteres
                    </div>
                    <div className={hasNumber ? "is-valid" : ""}>
                        <span className="rule-icon">{hasNumber ? "✔" : "○"}</span>
                        Al menos un número
                    </div>
                    <div className={hasSign ? "is-valid" : ""}>
                        <span className="rule-icon">{hasSign ? "✔" : "○"}</span>
                        Al menos un signo
                    </div>
                    <div className={matches ? "is-valid" : ""}>
                        <span className="rule-icon">{matches ? "✔" : "○"}</span>
                        Las contraseñas coinciden
                    </div>
                </div>

                {error ? <p className="form-notice is-error">{error}</p> : null}
                {message ? <p className="form-notice is-success">{message}</p> : null}

                <div className="form-actions">
                    <button type="submit" disabled={saving}>
                        {saving ? "Actualizando..." : "Actualizar"}
                    </button>
                </div>
            </form>

            {showConfirmModal ? (
                <div className="confirm-modal-backdrop" role="dialog" aria-modal="true">
                    <div className="confirm-modal">
                        <h3>Confirmar cambio</h3>
                        <div className="confirm-alert">
                            <span className="confirm-alert-icon">!</span>
                            <p>
                                Estás por actualizar tu contraseña. Asegúrate de recordarla para tu
                                siguiente inicio de sesión.
                            </p>
                        </div>

                        <div className="confirm-modal-actions">
                            <button
                                type="button"
                                className="confirm-cancel"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="confirm-accept"
                                onClick={submitPasswordChange}
                                disabled={saving}
                            >
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}