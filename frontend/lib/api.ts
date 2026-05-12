import type {
  ApplicationItemNew,
  AuthUser,
  ChangePasswordPayload,
  ClientProfile,
  LoginResponse,
  ProductItem,
  institutionItem,
  UpdateClientProfilePayload,
  RegisterPayload,
  RegisterDataPayload,
  PdfDataPayload,
  CurpDataPayload,
  SendCodePayload,
  validateCodePayload,
  ValidateCodeResponse,
  DetalleCotizacion,
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

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    throw new Error("Sesión expirada");
  } 

  let json;

  try {
    json = await response.json();
  } catch (e) {
    const text = await response.text();
    console.error("Respuesta no JSON:", text);

    throw new Error(text || "Respuesta inválida del servidor");
  }

  if (!response.ok) {
    throw new Error(
      typeof json?.message === "string" ? json.message : JSON.stringify(json),
    );

  }

  return json.data ?? json;
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

// ------------------------------MODULO SOLICITUDES ------------------------------
export function getClientApplications() {
  return apiFetch<ApplicationItemNew[]>("/applications", { auth: true });
}

// ------------------------------MODULO PERFIL ------------------------------

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

// ------------------------------MODULO REGISTRO Y LOGIN ------------------------------

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

export function sendRecoverPasswordRequest(payload: { correo: string }) {
  return apiFetch<{ success: boolean; message?: string }>(
    "/auth/send-recover-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

// ------------------------------MODULO PRODUCTO ------------------------------

export function getProductosRequest() {
  return apiFetch<institutionItem[]>("/products/institucion", {
    method: "GET",
    auth: true,
  });
}

export function getProductoById(producto_id: number) {
  return apiFetch<null>(`/products/${producto_id}`, {
    method: "GET",
    auth: true,
  });
}

// ------------------------------MODULO COTIZACION ------------------------------

export function cotizarRequest(payload: {
  monto: number;
  ingreso: number;
}) {
  return apiFetch<
    {
      producto_id: number;
      nombre: string;
      monto_aprobado: number;
      plazo: number;
      pago_periodico: number;
    }[]
  >("/quotation/cotizar", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}


export function detalleRequest(data: {
  producto_id: number;
  monto: number;
  plazo: number;
}) {
  return apiFetch<DetalleCotizacion>("/quotation/detalle", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}
