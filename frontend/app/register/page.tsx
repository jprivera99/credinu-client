"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerRequest } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    usuario: "",
    email: "",
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_nacimiento: "",
    sexo: "",
    rfc: "",
    curp: "",
    telefono: "",
    terms: false
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    setError("");

    if (!form.terms) {
      return setError("Debes aceptar los términos");
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-5xl p-8 rounded-2xl shadow-md"
      >
        <h2 className="text-3xl font-bold text-center mb-2">
          Registro de Clientes
        </h2>

        <p className="text-center text-gray-500 mb-6">
          Completa tus datos para comenzar
        </p>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4">

          <input name="email" placeholder="Correo electrónico" onChange={handleChange} className="input" />

          <input name="nombre" placeholder="Nombre(s)" onChange={handleChange} className="input" />
          <input name="apellido_paterno" placeholder="Apellido Paterno" onChange={handleChange} className="input" />

          <input name="apellido_materno" placeholder="Apellido Materno" onChange={handleChange} className="input" />
          <input name="fecha_nacimiento" type="date" onChange={handleChange} className="input" />

          <select name="sexo" onChange={handleChange} className="input">
            <option value="">Sexo</option>
            <option value="H">Hombre</option>
            <option value="M">Mujer</option>
          </select>

          <input name="telefono" placeholder="Teléfono" onChange={handleChange} className="input" />

          <input name="rfc" placeholder="RFC" onChange={handleChange} className="input" />
          <input name="curp" placeholder="CURP" onChange={handleChange} className="input" />

        </div>

        {/* CHECKBOXES */}
        <div className="mt-6 space-y-2 text-sm">

          <label className="flex items-center gap-2">
            <input type="checkbox" name="terms" onChange={handleChange} />
            Acepto los términos y condiciones
          </label>

        </div>

        {/* BOTÓN */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
        >
          {loading ? "Registrando..." : "CONTINUAR"}
        </button>

        {/* LOGIN */}
        <p className="text-center text-sm mt-4">
          ¿Ya tienes cuenta?{" "}
          <span
            className="text-blue-600 cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Inicia sesión
          </span>
        </p>

      </form>
    </div>
  );
}