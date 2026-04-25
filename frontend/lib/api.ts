import type {
  ApplicationItem,
  AuthUser,
  ChangePasswordPayload,
  ClientProfile,
  LoginResponse,
  ProductItem,
  UpdateClientProfilePayload,
  RegisterPayload,
  RegisterDataPayload,
  PdfDataPayload,
  CurpDataPayload,
  SendCodePayload,
  validateCodePayload,
  ValidateCodeResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type FetchOptions = RequestInit & {
  auth?: boolean;
};

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
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

// Funciones para registro de usuarios-----------------------------------------

export function registerRequest(payload: RegisterPayload) {
  return apiFetch<{ id: number; usuario: string }>("/register/pre-register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function validateRegisterRequest(payload: RegisterDataPayload) {
  return apiFetch<{ valid: boolean }>("/register/validate-register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------Api para calcular RFC
export function calcularRFCRequest(payload: PdfDataPayload) {
  return apiFetch<{ rfc: string }>("/register/send-rfc", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------Api para calcular CURP
export function calcularCURPRequest(payload: CurpDataPayload) {
  return apiFetch<{ curp: string }>("/register/send-curp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------Apis para instituciones
export function getInstitutionsRequest() {
  return apiFetch<{ id: number; nombre: string }[]>(
    "/institutions/get-institutions",
    {
      method: "GET",
    },
  );
}

export function getInstitutionRequest(institucionId: number) {
  return apiFetch<{
    id: number;
    nombre: string;
    empresas_hijas: { id: number; nombre: string }[];
  }>(`/institutions/get-institution?id=${institucionId}`, {
    method: "GET",
  });
}

// ---------------Apis para REM
export function sendCodeRequest(payload: SendCodePayload) {
  return apiFetch<{ success: boolean; message?: string }>("/rem/send-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function validateCodeRequest(payload: validateCodePayload) {
  return apiFetch<ValidateCodeResponse>("/rem/validate-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------Api para actualizar contraseña

export function changePasswordRequest(payload: ChangePasswordPayload) {
  return apiFetch<{ updated: boolean }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
