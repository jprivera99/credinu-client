"use client";

import { useState } from "react";

export default function ValidarSMS() {

  const [codigo, setCodigo] = useState("");

  const handleValidar = () => {
    console.log("Código:", codigo);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow w-96 text-center">

        <h2 className="text-xl font-bold mb-4">
          Validar Teléfono
        </h2>

        <p className="text-gray-500 mb-4">
          Ingresa el código enviado por SMS
        </p>

        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="input text-center text-lg"
          maxLength={6}
        />

        <button
          onClick={handleValidar}
          className="w-full mt-4 bg-green-600 text-white p-2 rounded"
        >
          Validar
        </button>

      </div>
    </div>
  );
}