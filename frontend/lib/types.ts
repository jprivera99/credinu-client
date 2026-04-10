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
