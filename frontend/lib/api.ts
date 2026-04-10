import type {
  ApplicationItem,
  AuthUser,
  ChangePasswordPayload,
  ClientProfile,
  LoginResponse,
  ProductItem,
  UpdateClientProfilePayload,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type FetchOptions = RequestInit & {
  auth?: boolean;
};

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (options.auth && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", "Bearer " + token);
    }
  }

  const response = await fetch(API_URL + path, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.message || "Ocurrió un error");
  }

  return (json.data ?? json) as T;
}

export function loginRequest(payload: { usuario: string; password: string }) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return apiFetch<AuthUser>("/auth/me", { auth: true });
}

export function getClientProducts() {
  return apiFetch<ProductItem[]>("/products", { auth: true });
}

export function getClientApplications() {
  return apiFetch<ApplicationItem[]>("/applications", { auth: true });
}

export function getClientProfile() {
  return apiFetch<ClientProfile>("/user/me", { auth: true });
}

export function updateClientProfile(payload: UpdateClientProfilePayload) {
  return apiFetch<{ updated: boolean }>("/user/me", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function changePassword(payload: ChangePasswordPayload) {
  return apiFetch<{ updated: boolean }>("/auth/change-password", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}