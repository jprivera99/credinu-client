export interface AuthUser {
  id: number;
  nombre: string;
  usuario: string;
  email?: string | null;
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
  email: string | null;
  telefono_movil: string | null;
  domicilio_cp: string | null;
  domicilio_calle: string | null;
  domicilio_numero: string | null;
}

export interface UpdateClientProfilePayload {
  email?: string | null;
  telefono_movil?: string | null;
  domicilio_cp?: string | null;
  domicilio_calle?: string | null;
  domicilio_numero?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export type RegisterPayload = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
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
  message: string;
  data: {
    success: boolean;
    result: {
      user: string;
      validated_at: string;
      type: string;
      match: boolean;
    };
  };
};
