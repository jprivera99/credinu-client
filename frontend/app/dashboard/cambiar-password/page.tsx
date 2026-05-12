"use client";

import { useState } from "react";
import { changePassword } from "@/lib/api";

export default function CambiarPasswordPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

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

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const validationMessage = validateForm();

        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        const confirmed = window.confirm("Estas seguro de cambiar tu contraseña?");

        if (!confirmed) {
            return;
        }

        try {
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
        }
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
                    />
                </label>

                <label>
                    <span>Nueva contraseña</span>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </label>

                <label>
                    <span>Confirmar nueva contraseña</span>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </label>

                <div style={{ marginTop: 4, fontSize: 13 }}>
                    <div style={{ color: hasMinLength ? "#0f5f2c" : "#6b7280" }}>
                        {hasMinLength ? "✔" : "○"} Minimo 8 caracteres
                    </div>
                    <div style={{ color: hasNumber ? "#0f5f2c" : "#6b7280" }}>
                        {hasNumber ? "✔" : "○"} Al menos un numero
                    </div>
                    <div style={{ color: hasSign ? "#0f5f2c" : "#6b7280" }}>
                        {hasSign ? "✔" : "○"} Al menos un signo
                    </div>
                    <div style={{ color: matches ? "#0f5f2c" : "#6b7280" }}>
                        {matches ? "✔" : "○"} Las contraseñas coinciden
                    </div>
                </div>

                {error ? <p className="error-copy">{error}</p> : null}
                {message ? <p className="success-copy">{message}</p> : null}

                <button type="submit">Actualizar contraseña</button>
            </form>
        </section>
    );
}