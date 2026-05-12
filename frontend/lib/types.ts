export interface AuthUser {
  id: number;
  nombre: string;
  usuario: string;
  correo?: string | null;
  perfil_id: number;
  cliente_id: number;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ProductItem {
  id: number;
  nombre_comercial: string;
  descripcion: string[];
  disponibilidad: string | null;
}

export interface ApplicationItem {
  id: number;
  estatus_id: number | null;
  estatus: string | null;
  producto: string | null;
  fecha_registro: string | null;
}

export interface ClientProfile {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  rfc: string;
  curp: string;
  correo: string | null;
  telefono_movil: string | null;
  domicilio_cp: string | null;
  domicilio_calle: string | null;
  domicilio_numero: string | null;
}

export interface UpdateClientProfilePayload {
  correo?: string | null;
  telefono_movil?: string | null;
  domicilio_cp?: string | null;
  domicilio_calle?: string | null;
  domicilio_numero?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordRecoveryPayload {
  token: string;
  newPassword: string;
}

export type RegisterPayload = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  telefono?: string;
  rfc?: string;
  curp?: string;
};

export type RegisterDataPayload = {
  correo: string;
  telefono?: string;
  rfc?: string;
  curp?: string;
};

export type PdfDataPayload = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
};

export type CurpDataPayload = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  sexo: string;
  estado_nacimiento: string;
};

export type SendCodePayload = {
  canal: "SMS" | "WHATSAPP";
  phone: string;
  nombre_cliente: string;
  retry?: boolean;
};

export type validateCodePayload = {
  phone: string;
  code: string;
  canal: string;
};

export type ValidateCodeResponse = {
  success: boolean;
  result: {
    user: string;
    validated_at: string;
    type: string;
    match: boolean;
  };
};

//-------------------------------MODULO PRODUCTOS ------------------------------

export type institutionItem = {
  id: number;
  nombre_comercial: string;
  descripcion: string;
  nombre?: string;
  monto_min?: number;
  monto_max?: number;
  plazo_min?: number;
  plazo_max?: number;
  periodicidad?: string;
  tasa?: number;

  prod_simulador?: {
    disponible_desde_mes: number;
    disponible_desde_dia: number;
  };
};

//-------------------------------MODULO COTIZACIONES -----------------------------

export type Pago = {
  periodo: number;
  saldo_inicial: number;
  interes: number;
  capital: number;
  pago: number;
  saldo_final: number;
};

export type DetalleCotizacion = {
  producto: string;
  monto: number;
  plazo: number;
  tasa: number;
  pago: number;
  tabla: Pago[];
};

export interface ProductoCotizacion {
  producto_id: number;
  nombre_comercial: string;
  monto_aprobado: number;
  plazo: number;
  periodicidad: string;
}

//-------------------------------MODULO SOLICITUDES ------------------------------

export type ApplicationItemNew = {
  id: number;
  fecha_registro: string;
  monto_credito: number;
  estatus: string;
  estatus_id: number;
  producto?: string;
  pago_semanal: number;
};