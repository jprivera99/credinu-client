const API_URL = "http://localhost:3001/api";

export const loginRequest = async (data: {
  usuario: string;
  password: string;
}) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Error en login");
  }

  return json;
};

export const getPerfil = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/user/perfil`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};