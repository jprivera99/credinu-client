// lib/solicitud.ts
// Tipos y utilidades del módulo de cotización, solicitudes, documentos y préstamos.

export type Catalogo = { id: number; nombre: string };

export type FilaAmortizacion = {
  periodo: number;
  fecha: string | null;
  saldo_inicial: number;
  interes: number;
  iva: number;
  capital: number;
  pago: number;
  saldo_final: number;
};

export type ProductoCotizado = {
  id: number;
  producto_id: number | null;
  nombre_comercial: string;
  monto_aprobado: number;
  plazo: number;
  duracion: number;
  periodicidad: string;
  pago_periodico: number;
  total_pagar: number;
  express: number;
  fecha_disponible: string | null;
};

export type DetalleCotizacion = {
  id: number;
  producto: string;
  monto: number;
  plazo: number;
  plazo_min: number;
  plazo_max: number;
  periodicidad: string;
  num_pagos: number;
  tasa: number | null;
  pago: number;
  total_pagar: number;
  pagos_resumen: { valor: string; veces: number }[] | null;
  express: number;
  detalle_completo: number;
  fecha_disponible: string | null;
  mensajes: unknown;
  tabla: FilaAmortizacion[];
};

export type SolicitudListado = {
  id: number;
  estatus_id: number;
  estatus: string | null;
  fecha_registro: string | null;
  monto_credito: number;
  producto: string | null;
  puede_continuar: boolean;
  requiere_firma: boolean;
};

export type PasoClave =
  | "domicilio"
  | "datos_generales"
  | "referencias"
  | "redes_sociales"
  | "contrato"
  | "clabe"
  | "documentos"
  | "buro"
  | "enviar";

export type Paso = { clave: PasoClave; completo: boolean; faltantes: string[] };

export type DocumentoRequerido = {
  tipo: number;
  nombre: string;
  descripcion: string | null;
  estado: "faltante" | "renovar" | "vigente";
  documento_id: number | null;
  fecha_vigencia: string | null;
};

export type Domicilio = {
  cp: string;
  estado_id: number | null;
  estado: string;
  municipio_id: number | null;
  municipio: string;
  ciudad_id: number | null;
  ciudad: string;
  colonia_id: number | null;
  colonia: string;
  calle: string;
  numero_exterior: string;
  numero_interior: string;
};

export type DatosGenerales = {
  ocupacion_profesion: string;
  empleo_puesto: string;
  empleo_departamento: string;
  giro_negocio: string;
  ciudad_nacimiento: string;
  domicilio_tipo: number | null;
  domicilio_antiguedadanios: string | number;
  estado_civil: number | null;
  regimen_patrimonial: number | null;
  dependientes_economicos: string | number;
  grado_estudio_id: number | null;
  grado_estudios_otros: string;
};

export type Referencia = { nombre: string; parentesco: string; telefono_movil: string };

export type RedesSociales = {
  facebook: string;
  instagram: string;
  linkedln: string;
  twitter: string;
  otros: string;
};

export type DatosContrato = {
  destino_credito: number | null;
  destino_credito_otros: string;
  porcentaje_vivienda: number | null;
  descripcion_vivienda: string;
  empleo_gastos_totales: string | number;
  nombre_negocio: string;
  tiempo_negocio: string;
  direccion_negocio: string;
  descr_cred_sol: string;
  cargo_negocio: string;
  personas_pol_exp: number | null;
  nombre_personas_pol_exp: string;
  cuenta_propia: number | null;
  nombre_tercero: string;
  propietario_real: number | null;
  nombre_propietario_real: string;
};

export type SolicitudDetalle = {
  solicitud: {
    id: number;
    estatus_id: number;
    estatus: string | null;
    motivo_rechazo: string | null;
    editable: boolean;
    express: boolean;
    fecha_registro: string | null;
    producto: string | null;
    tipo_producto: number | string | null;
    periodicidad: string | null;
    monto_credito: number;
    monto_autorizado: number;
    monto_pago: number;
    monto_total: number;
    total_pagos: number;
    plazo_meses: number | string | null;
    num_pagos_adelanto: number | string | null;
    monto_adelanto: number | string | null;
    clabe: string;
    clabe_valida: boolean;
    banco_nombre: string | null;
    detalle_completo: boolean;
    tabla: FilaAmortizacion[];
  };
  domicilio: Domicilio;
  datos_generales: DatosGenerales;
  referencias: Referencia[];
  redes_sociales: RedesSociales;
  contrato: DatosContrato;
  documentos: DocumentoRequerido[];
  buro_autorizado: boolean;
  pasos: Paso[];
};

export type CatalogosSolicitud = {
  domicilio_tipo: Catalogo[];
  estado_civil: Catalogo[];
  regimen_patrimonial: Catalogo[];
  grado_estudios: Catalogo[];
  destino_credito: Catalogo[];
  porcentaje_vivienda: Catalogo[];
  ids: {
    DESTINO_OTROS: number;
    DESTINO_MEJORA_VIVIENDA: number;
    DESTINO_PRODUCTIVO: number;
    GRADO_ESTUDIOS_OTROS: number;
  };
};

export type Sepomex = {
  cp: string;
  estados: Catalogo[];
  municipios: (Catalogo & { estado_id: number })[];
  ciudades: (Catalogo & { municipio_id: number })[];
  colonias: (Catalogo & { municipio_id: number; zona: string })[];
};

export type ClabeValidacion = {
  clabe: string;
  correcto: boolean;
  banco_id: number;
  banco_nombre: string;
  plaza_nombre: string;
  msg: string;
};

export type EnvioResultado = { estado: string; public_url?: string };

export type Prestamo = {
  id: number | string;
  producto: string;
  fecha: string;
  monto: number;
  plazo: number | string;
  tipo_duracion: string;
  periodicidad: string;
  pago: number;
  pago_inicial: string;
  saldo: number;
  pagos_totales: number;
  pagos_realizados: number;
  pagos_pendientes: number;
  estatus: string;
};

/* ---------------------------- Utilidades ---------------------------- */

export const ESTATUS = {
  SIN_ENVIAR: 680,
  CANCELADA: 681,
  ENVIADA: 11,
  FIRMA: 14,
  APROBADO: 16,
  RECHAZO_IDENTIDAD: 17,
};

export const PASO_TITULOS: Record<PasoClave, string> = {
  domicilio: "Domicilio",
  datos_generales: "Datos generales",
  referencias: "Referencias",
  redes_sociales: "Redes sociales",
  contrato: "Datos del contrato",
  clabe: "Cuenta CLABE",
  documentos: "Documentos",
  buro: "Buró de Crédito",
  enviar: "Enviar",
};

export const formatMoney = (value?: number | string | null) =>
  Number(value || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export const formatFecha = (value?: string | null) => {
  if (!value) return "—";
  const s = String(value).slice(0, 10);
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${meses[Number(m) - 1] || m} ${y}`;
};

export const formatFolio = (id: number) => String(id).padStart(5, "0");

export const periodoLabel = (periodicidad?: string | null, plural = true) => {
  const p = String(periodicidad || "").toLowerCase();
  const map: Record<string, [string, string]> = {
    semanal: ["semana", "semanas"],
    catorcenal: ["catorcena", "catorcenas"],
    quincenal: ["quincena", "quincenas"],
    decenal: ["decena", "decenas"],
    mensual: ["mes", "meses"],
  };
  const par = map[p] || ["periodo", "periodos"];
  return plural ? par[1] : par[0];
};

export const pagosLabel = (periodicidad?: string | null) => {
  const p = String(periodicidad || "").toLowerCase();
  const map: Record<string, string> = {
    semanal: "semanales",
    catorcenal: "catorcenales",
    quincenal: "quincenales",
    decenal: "decenales",
    mensual: "mensuales",
  };
  return map[p] || "";
};

/** Color de la etiqueta de estatus (mismos grupos que el expediente del sistema actual). */
export const estatusTono = (estatusId: number): "info" | "success" | "warning" | "danger" | "neutral" => {
  if ([16].includes(estatusId)) return "success";
  if ([15, 680].includes(estatusId)) return "warning";
  if ([17, 50, 681].includes(estatusId)) return "danger";
  if ([11, 12, 13, 14, 49, 695, 720].includes(estatusId)) return "info";
  return "neutral";
};

export const leerArchivoBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").replace(/^data:[^;]+;base64,/, ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
