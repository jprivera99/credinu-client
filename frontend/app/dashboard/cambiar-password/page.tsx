"use client";

import { useState } from "react";
import { changePassword } from "@/lib/api";

export default function CambiarPasswordPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setMessage("");

        try {
            await changePassword({ currentPassword, newPassword });
            setMessage("Contraseña actualizada correctamente");
            setCurrentPassword("");
            setNewPassword("");
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

                {error ? <p className="error-copy">{error}</p> : null}
                {message ? <p className="success-copy">{message}</p> : null}

                <button type="submit">Actualizar contraseña</button>
            </form>
        </section>
    );
}