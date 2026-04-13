"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();

    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
                    <h1>Portal Cliente</h1>
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
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Tu contraseña"
                            autoComplete="current-password"
                        />
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
                </form>
            </div>
        </div>
    );
}