"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();

    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: any) => {
        e.preventDefault();

        try {
            const data = await loginRequest({ usuario, password });

            localStorage.setItem("token", data.token);

            router.push("/dashboard");

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">

            <form
                onSubmit={handleLogin}
                className="bg-white p-8 rounded-xl shadow-md w-80"
            >
                <h2 className="text-xl font-bold mb-4">Login</h2>

                {error && <p className="text-red-500">{error}</p>}

                <input
                    type="text"
                    placeholder="Usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full p-2 mb-3 border rounded"
                />

                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mb-3 border rounded"
                />

                <button className="w-full bg-blue-600 text-white p-2 rounded">
                    Entrar
                </button>
            </form>
        </div>
    );
}