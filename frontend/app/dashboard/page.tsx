"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPerfil } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      const data = await getPerfil();
      setUser(data);
    };

    fetchData();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>

      {user ? (
        <div>
          <p><b>Nombre:</b> {user.nombre}</p>
          <p><b>Usuario:</b> {user.usuario}</p>
          <p><b>Email:</b> {user.email}</p>
        </div>
      ) : (
        <p>Cargando...</p>
      )}
    </div>
  );
}