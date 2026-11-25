"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  authorizeBuroRequest,
  getDocumentFileRequest,
  getSepomexRequest,
  saveApplicationSection,
  sendApplicationRequest,
  uploadDocumentRequest,
  validateClabeRequest,
} from "@/lib/api";
import type {
  CatalogosSolicitud,
  ClabeValidacion,
  DatosContrato,
  DatosGenerales,
  Domicilio,
  EnvioResultado,
  Referencia,
  RedesSociales,
  Sepomex,
  SolicitudDetalle,
} from "@/lib/solicitud";
import { formatFecha, formatMoney, leerArchivoBase64, pagosLabel } from "@/lib/solicitud";
import { Alert, Field, SelectCatalogo, SiNo, errorMessage } from "@/components/portal/ui";

export type PasoProps = {
  id: number;
  data: SolicitudDetalle;
  catalogos: CatalogosSolicitud | null;
  onBack?: () => void;
  /** Guarda y avanza al siguiente paso */
  onSaved: () => Promise<void> | void;
  /** Solo recarga la información (sin avanzar) */
  onRefresh: () => Promise<void> | void;
};

/* ----------------------------------------------------------------------- */
/* Estructura común de cada paso                                            */
/* ----------------------------------------------------------------------- */

function PasoLayout({
  titulo,
  descripcion,
  error,
  children,
  onBack,
  onSubmit,
  guardando,
  textoBoton = "Guardar y continuar",
  deshabilitado,
}: {
  titulo: string;
  descripcion?: ReactNode;
  error?: string;
  children: ReactNode;
  onBack?: () => void;
  onSubmit: () => void;
  guardando?: boolean;
  textoBoton?: string;
  deshabilitado?: boolean;
}) {
  return (
    <form
      className="cx-card"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div className="cx-card-header">
        <div>
          <h3 className="cx-card-title">{titulo}</h3>
          {descripcion ? <p className="cx-card-text">{descripcion}</p> : null}
        </div>
      </div>

      {children}

      {error ? (
        <div style={{ marginTop: 18 }}>
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <div className="cx-actions">
        {onBack ? (
          <button type="button" className="cx-btn cx-btn-secondary" onClick={onBack} disabled={guardando}>
            Regresar
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="cx-btn cx-btn-primary" disabled={guardando || deshabilitado}>
          {guardando ? "Guardando..." : textoBoton}
        </button>
      </div>
    </form>
  );
}

const mayus = (v: string) => v.toUpperCase();

/** Ejecuta el guardado de una sección con manejo de errores. */
function useGuardar(id: number, seccion: string, onSaved: PasoProps["onSaved"]) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async (datos: unknown, validar?: () => string | null) => {
    setError("");
    const msg = validar ? validar() : null;
    if (msg) {
      setError(msg);
      return;
    }
    setGuardando(true);
    try {
      await saveApplicationSection(id, seccion, datos);
      await onSaved();
    } catch (err) {
      setError(errorMessage(err, "No fue posible guardar la información"));
    } finally {
      setGuardando(false);
    }
  };

  return { guardar, guardando, error, setError };
}

/* ----------------------------------------------------------------------- */
/* 1. Domicilio                                                             */
/* ----------------------------------------------------------------------- */

export function PasoDomicilio({ id, data, onBack, onSaved }: PasoProps) {
  const [form, setForm] = useState<Domicilio>(data.domicilio);
  const [sepomex, setSepomex] = useState<Sepomex | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [errorCp, setErrorCp] = useState("");
  const { guardar, guardando, error } = useGuardar(id, "domicilio", onSaved);

  const set = <K extends keyof Domicilio>(k: K, v: Domicilio[K]) => setForm((f) => ({ ...f, [k]: v }));

  const buscarCp = async (cp: string, conservar = false) => {
    setErrorCp("");
    if (cp.length !== 5) {
      setSepomex(null);
      return;
    }
    setBuscando(true);
    try {
      const res = await getSepomexRequest(cp);
      setSepomex(res);
      setForm((f) => {
        const estado = res.estados.find((e) => e.id === f.estado_id) || res.estados[0];
        const municipios = res.municipios.filter((m) => m.estado_id === estado?.id);
        const municipio =
          (conservar && municipios.find((m) => m.id === f.municipio_id)) ||
          (municipios.length === 1 ? municipios[0] : undefined);
        const colonias = res.colonias.filter((c) => c.municipio_id === municipio?.id);
        const colonia = conservar ? colonias.find((c) => c.id === f.colonia_id) : undefined;
        const ciudades = res.ciudades.filter((c) => c.municipio_id === municipio?.id);
        const ciudad = (conservar && ciudades.find((c) => c.id === f.ciudad_id)) || ciudades[0];
        return {
          ...f,
          estado_id: estado?.id ?? null,
          estado: estado?.nombre ?? "",
          municipio_id: municipio?.id ?? null,
          municipio: municipio?.nombre ?? "",
          colonia_id: colonia?.id ?? null,
          colonia: colonia?.nombre ?? "",
          ciudad_id: ciudad?.id ?? null,
          ciudad: ciudad?.nombre ?? "",
        };
      });
    } catch (err) {
      setSepomex(null);
      setErrorCp(errorMessage(err, "No encontramos ese código postal"));
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    if (data.domicilio.cp?.length === 5) buscarCp(data.domicilio.cp, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const municipios = sepomex?.municipios.filter((m) => m.estado_id === form.estado_id) || [];
  const colonias = sepomex?.colonias.filter((c) => c.municipio_id === form.municipio_id) || [];
  const ciudades = sepomex?.ciudades.filter((c) => c.municipio_id === form.municipio_id) || [];

  return (
    <PasoLayout
      titulo="Domicilio"
      descripcion="Confirma tu domicilio actual. Escribe tu código postal para cargar estado, municipio y colonias."
      error={error}
      onBack={onBack}
      guardando={guardando}
      onSubmit={() =>
        guardar(form, () => {
          if (!sepomex) return "Escribe un código postal válido.";
          if (!form.municipio_id) return "Selecciona tu municipio.";
          if (!form.colonia_id) return "Selecciona tu colonia.";
          if (!form.calle.trim()) return "Escribe tu calle.";
          if (!form.numero_exterior.trim()) return "Escribe tu número exterior.";
          return null;
        })
      }
    >
      <div className="cx-grid cx-grid-3">
        <Field label="Código postal" required help={buscando ? "Buscando..." : errorCp || undefined}>
          <input
            className={`cx-input ${errorCp ? "is-invalid" : ""}`}
            inputMode="numeric"
            maxLength={5}
            value={form.cp}
            onChange={(e) => {
              const cp = e.target.value.replace(/\D/g, "").slice(0, 5);
              set("cp", cp);
              buscarCp(cp);
            }}
          />
        </Field>
        <Field label="Estado" required>
          <input className="cx-input" value={form.estado} disabled />
        </Field>
        <Field label="Municipio" required>
          <SelectCatalogo
            value={form.municipio_id}
            options={municipios}
            disabled={!sepomex}
            onChange={(v) => {
              const m = municipios.find((x) => x.id === v);
              const ciudad = sepomex?.ciudades.find((c) => c.municipio_id === v);
              setForm((f) => ({
                ...f,
                municipio_id: v,
                municipio: m?.nombre ?? "",
                colonia_id: null,
                colonia: "",
                ciudad_id: ciudad?.id ?? null,
                ciudad: ciudad?.nombre ?? "",
              }));
            }}
          />
        </Field>
        <Field label="Colonia" required>
          <SelectCatalogo
            value={form.colonia_id}
            options={colonias}
            disabled={!form.municipio_id}
            onChange={(v) => {
              const c = colonias.find((x) => x.id === v);
              setForm((f) => ({ ...f, colonia_id: v, colonia: c?.nombre ?? "" }));
            }}
          />
        </Field>
        <Field label="Ciudad">
          <SelectCatalogo
            value={form.ciudad_id}
            options={ciudades}
            disabled={!ciudades.length}
            placeholder={ciudades.length ? "Seleccione" : "No aplica"}
            onChange={(v) => {
              const c = ciudades.find((x) => x.id === v);
              setForm((f) => ({ ...f, ciudad_id: v, ciudad: c?.nombre ?? "" }));
            }}
          />
        </Field>
        <Field label="Calle" required className="cx-span-2">
          <input className="cx-input" maxLength={150} value={form.calle} onChange={(e) => set("calle", mayus(e.target.value))} />
        </Field>
        <div className="cx-grid cx-grid-2">
          <Field label="No. exterior" required>
            <input
              className="cx-input"
              maxLength={20}
              value={form.numero_exterior}
              onChange={(e) => set("numero_exterior", mayus(e.target.value))}
            />
          </Field>
          <Field label="No. interior">
            <input
              className="cx-input"
              maxLength={20}
              value={form.numero_interior}
              onChange={(e) => set("numero_interior", mayus(e.target.value))}
            />
          </Field>
        </div>
      </div>
    </PasoLayout>
  );
}

/* ----------------------------------------------------------------------- */
/* 2. Datos generales                                                       */
/* ----------------------------------------------------------------------- */

export function PasoDatosGenerales({ id, data, catalogos, onBack, onSaved }: PasoProps) {
  const [form, setForm] = useState<DatosGenerales>(data.datos_generales);
  const { guardar, guardando, error } = useGuardar(id, "datos_generales", onSaved);
  const set = <K extends keyof DatosGenerales>(k: K, v: DatosGenerales[K]) => setForm((f) => ({ ...f, [k]: v }));
  const otros = catalogos?.ids.GRADO_ESTUDIOS_OTROS ?? 677;

  const texto = (k: keyof DatosGenerales, label: string, className = "") => (
    <Field label={label} required className={className}>
      <input
        className="cx-input"
        maxLength={150}
        value={String(form[k] ?? "")}
        onChange={(e) => set(k, mayus(e.target.value) as never)}
      />
    </Field>
  );

  return (
    <PasoLayout
      titulo="Datos generales"
      descripcion="Favor de llenar la información solicitada."
      error={error}
      onBack={onBack}
      guardando={guardando}
      onSubmit={() =>
        guardar(form, () => {
          const req: [keyof DatosGenerales, string][] = [
            ["ocupacion_profesion", "Ocupación o profesión"],
            ["empleo_puesto", "Puesto que desempeña"],
            ["empleo_departamento", "Área o departamento"],
            ["giro_negocio", "Actividad o giro de la empresa"],
            ["ciudad_nacimiento", "Ciudad de nacimiento"],
            ["domicilio_tipo", "El domicilio donde habita es"],
            ["domicilio_antiguedadanios", "Años de residir en el domicilio"],
            ["estado_civil", "Estado civil"],
            ["regimen_patrimonial", "Régimen matrimonial"],
            ["dependientes_economicos", "No. de dependientes económicos"],
            ["grado_estudio_id", "Grado máximo de estudios"],
          ];
          for (const [k, label] of req) {
            const v = form[k];
            if (v === null || v === undefined || String(v).trim() === "") return `El campo "${label}" no puede estar vacío.`;
          }
          if (form.grado_estudio_id === otros && !form.grado_estudios_otros.trim()) {
            return "Especifica tu grado de estudios.";
          }
          return null;
        })
      }
    >
      <div className="cx-grid cx-grid-2">
        {texto("ocupacion_profesion", "¿Cuál es su ocupación o profesión?")}
        {texto("empleo_puesto", "¿Qué puesto desempeña?")}
        {texto("empleo_departamento", "¿A qué área o departamento pertenece?")}
        {texto("giro_negocio", "¿Cuál es la actividad o giro de la empresa?")}
        {texto("ciudad_nacimiento", "¿Cuál es su ciudad de nacimiento?")}
        <Field label="El domicilio donde usted habita es" required>
          <SelectCatalogo
            value={form.domicilio_tipo}
            options={catalogos?.domicilio_tipo || []}
            onChange={(v) => set("domicilio_tipo", v)}
          />
        </Field>
        <Field label="Años de residir en el domicilio actual" required>
          <input
            className="cx-input"
            inputMode="numeric"
            maxLength={3}
            value={String(form.domicilio_antiguedadanios ?? "")}
            onChange={(e) => set("domicilio_antiguedadanios", e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Field label="Estado civil" required>
          <SelectCatalogo
            value={form.estado_civil}
            options={catalogos?.estado_civil || []}
            onChange={(v) => set("estado_civil", v)}
          />
        </Field>
        <Field label="Régimen matrimonial" required>
          <SelectCatalogo
            value={form.regimen_patrimonial}
            options={catalogos?.regimen_patrimonial || []}
            onChange={(v) => set("regimen_patrimonial", v)}
          />
        </Field>
        <Field label="No. de dependientes económicos" required>
          <input
            className="cx-input"
            inputMode="numeric"
            maxLength={2}
            value={String(form.dependientes_economicos ?? "")}
            onChange={(e) => set("dependientes_economicos", e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Field label="Grado máximo de estudios" required>
          <SelectCatalogo
            value={form.grado_estudio_id}
            options={catalogos?.grado_estudios || []}
            onChange={(v) => setForm((f) => ({ ...f, grado_estudio_id: v, grado_estudios_otros: v === otros ? f.grado_estudios_otros : "" }))}
          />
        </Field>
        {form.grado_estudio_id === otros ? texto("grado_estudios_otros", 'En caso de "Otros", especifique') : null}
      </div>
    </PasoLayout>
  );
}

/* ----------------------------------------------------------------------- */
/* 3. Referencias personales                                                */
/* ----------------------------------------------------------------------- */

export function PasoReferencias({ id, data, onBack, onSaved }: PasoProps) {
  const [refs, setRefs] = useState<Referencia[]>(
    [0, 1, 2].map((i) => data.referencias[i] || { nombre: "", parentesco: "", telefono_movil: "" }),
  );
  const { guardar, guardando, error } = useGuardar(id, "referencias", onSaved);

  const set = (i: number, k: keyof Referencia, v: string) =>
    setRefs((r) => r.map((ref, idx) => (idx === i ? { ...ref, [k]: v } : ref)));

  return (
    <PasoLayout
      titulo="Referencias personales"
      descripcion="Agrega tres personas que te conozcan y que no vivan contigo."
      error={error}
      onBack={onBack}
      guardando={guardando}
      onSubmit={() =>
        guardar(refs, () => {
          for (let i = 0; i < 3; i++) {
            const r = refs[i];
            if (!r.nombre.trim() || !r.parentesco.trim()) return `Completa el nombre y parentesco de la referencia ${i + 1}.`;
            if (r.telefono_movil.replace(/\D/g, "").length !== 10) return `El teléfono de la referencia ${i + 1} debe tener 10 dígitos.`;
          }
          const tels = refs.map((r) => r.telefono_movil);
          if (new Set(tels).size !== tels.length) return "Cada referencia debe tener un teléfono distinto.";
          return null;
        })
      }
    >
      <div className="cx-grid" style={{ gap: 20 }}>
        {refs.map((r, i) => (
          <fieldset key={i} style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="cx-eyebrow" style={{ marginBottom: 10 }}>
              Referencia {i + 1}
            </legend>
            <div className="cx-grid cx-grid-3">
              <Field label="Nombre completo" required>
                <input className="cx-input" maxLength={150} value={r.nombre} onChange={(e) => set(i, "nombre", mayus(e.target.value))} />
              </Field>
              <Field label="Parentesco" required>
                <input
                  className="cx-input"
                  maxLength={60}
                  placeholder="Ej. HERMANO, AMIGO"
                  value={r.parentesco}
                  onChange={(e) => set(i, "parentesco", mayus(e.target.value))}
                />
              </Field>
              <Field label="Teléfono celular" required>
                <input
                  className="cx-input"
                  inputMode="numeric"
                  maxLength={10}
                  value={r.telefono_movil}
                  onChange={(e) => set(i, "telefono_movil", e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </Field>
            </div>
          </fieldset>
        ))}
      </div>
    </PasoLayout>
  );
}

/* ----------------------------------------------------------------------- */
/* 4. Redes sociales                                                        */
/* ----------------------------------------------------------------------- */

export function PasoRedes({ id, data, onBack, onSaved }: PasoProps) {
  const [form, setForm] = useState<RedesSociales>(data.redes_sociales);
  const { guardar, guardando, error } = useGuardar(id, "redes_sociales", onSaved);

  const campos: [keyof RedesSociales, string][] = [
    ["facebook", "Facebook"],
    ["instagram", "Instagram"],
    ["linkedln", "LinkedIn"],
    ["twitter", "X (Twitter)"],
    ["otros", "Otra"],
  ];

  return (
    <PasoLayout
      titulo="Redes sociales"
      descripcion="Opcional. Escribe tu usuario o la liga de tu perfil."
      error={error}
      onBack={onBack}
      guardando={guardando}
      onSubmit={() => guardar(form)}
    >
      <div className="cx-grid cx-grid-2">
        {campos.map(([k, label]) => (
          <Field key={k} label={label}>
            <input
              className="cx-input"
              maxLength={200}
              value={form[k] || ""}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
            />
          </Field>
        ))}
      </div>
    </PasoLayout>
  );
}

/* ----------------------------------------------------------------------- */
/* 5. Datos complementarios del contrato                                    */
/* ----------------------------------------------------------------------- */

export function PasoContrato({ id, data, catalogos, onBack, onSaved }: PasoProps) {
  const [form, setForm] = useState<DatosContrato>(data.contrato);
  const { guardar, guardando, error } = useGuardar(id, "contrato", onSaved);
  const set = <K extends keyof DatosContrato>(k: K, v: DatosContrato[K]) => setForm((f) => ({ ...f, [k]: v }));

  const ids = catalogos?.ids || { DESTINO_OTROS: 63, DESTINO_MEJORA_VIVIENDA: 56, DESTINO_PRODUCTIVO: 697, GRADO_ESTUDIOS_OTROS: 677 };
  const destino = form.destino_credito;

  const texto = (k: keyof DatosContrato, label: string, required = true, className = "cx-span-2") => (
    <Field label={label} required={required} className={className}>
      <input
        className="cx-input"
        maxLength={255}
        value={String(form[k] ?? "")}
        onChange={(e) => set(k, mayus(e.target.value) as never)}
      />
    </Field>
  );

  return (
    <PasoLayout
      titulo="Datos complementarios del contrato"
      descripcion="Información requerida por la regulación para el otorgamiento del crédito."
      error={error}
      onBack={onBack}
      guardando={guardando}
      onSubmit={() =>
        guardar(form, () => {
          if (!destino) return "Selecciona el destino del crédito.";
          if (destino === ids.DESTINO_OTROS && !form.destino_credito_otros.trim()) return 'Especifica el destino en "Otros".';
          if (destino === ids.DESTINO_MEJORA_VIVIENDA && (!form.porcentaje_vivienda || !form.descripcion_vivienda.trim())) {
            return "Completa los datos de la mejora de vivienda.";
          }
          if (
            destino === ids.DESTINO_PRODUCTIVO &&
            [form.nombre_negocio, form.tiempo_negocio, form.direccion_negocio, form.descr_cred_sol, form.cargo_negocio].some((v) => !v.trim())
          ) {
            return "Completa los datos del negocio.";
          }
          if (!form.personas_pol_exp) return "Indica si ha ocupado un puesto en el gobierno.";
          if (form.personas_pol_exp === 1 && !form.nombre_personas_pol_exp.trim()) return "Escribe el nombre y cargo de la persona políticamente expuesta.";
          if (!form.cuenta_propia) return "Indica si actúas por cuenta propia.";
          if (form.cuenta_propia === 2 && !form.nombre_tercero.trim()) return "Escribe el nombre del tercero.";
          if (!form.propietario_real) return "Indica si eres el propietario real de los recursos.";
          if (form.propietario_real === 2 && !form.nombre_propietario_real.trim()) return "Escribe el nombre del propietario real.";
          return null;
        })
      }
    >
      <div className="cx-grid cx-grid-2">
        <Field label="Destino del crédito" required>
          <SelectCatalogo
            value={destino}
            options={catalogos?.destino_credito || []}
            onChange={(v) => set("destino_credito", v)}
          />
        </Field>
        <Field label="Gastos mensuales totales" help="Comida, agua, renta, luz, colegiaturas, etc.">
          <input
            className="cx-input"
            inputMode="decimal"
            placeholder="$0.00"
            value={String(form.empleo_gastos_totales ?? "")}
            onChange={(e) => set("empleo_gastos_totales", e.target.value.replace(/[^\d.]/g, ""))}
          />
        </Field>

        {destino === ids.DESTINO_OTROS ? texto("destino_credito_otros", 'En caso de "Otros", especifique') : null}

        {destino === ids.DESTINO_MEJORA_VIVIENDA ? (
          <>
            <Field label="Tipo de mejora de vivienda" required>
              <SelectCatalogo
                value={form.porcentaje_vivienda}
                options={catalogos?.porcentaje_vivienda || []}
                onChange={(v) => set("porcentaje_vivienda", v)}
              />
            </Field>
            {texto("descripcion_vivienda", "Breve descripción de la mejora", true, "")}
          </>
        ) : null}

        {destino === ids.DESTINO_PRODUCTIVO ? (
          <>
            {texto("nombre_negocio", "Nombre del negocio", true, "")}
            {texto("tiempo_negocio", "Tiempo de operación del negocio", true, "")}
            {texto("direccion_negocio", "Dirección del negocio")}
            {texto("descr_cred_sol", "¿Para qué va a utilizar el crédito?", true, "")}
            {texto("cargo_negocio", "Puesto que ocupa en el negocio", true, "")}
          </>
        ) : null}
      </div>

      <hr className="cx-divider" />

      <div className="cx-grid" style={{ gap: 20 }}>
        <div className="cx-field">
          <span className="cx-label">
            ¿Trabaja actualmente o ha trabajado durante este año en puestos directivos o de mando en el gobierno o la
            Administración Pública?<span className="cx-req">*</span>
          </span>
          <SiNo name="pep" value={form.personas_pol_exp} onChange={(v) => set("personas_pol_exp", v)} />
        </div>
        {form.personas_pol_exp === 1
          ? texto("nombre_personas_pol_exp", 'Nombre de la persona "Políticamente Expuesta" y cargo que desempeña o desempeñó', true, "")
          : null}

        <div className="cx-field">
          <span className="cx-label">
            Declaro bajo protesta de decir verdad que, para efectos de las operaciones con la SOFOM, estoy actuando por
            cuenta propia<span className="cx-req">*</span>
          </span>
          <SiNo name="propia" value={form.cuenta_propia} onChange={(v) => set("cuenta_propia", v)} />
        </div>
        {form.cuenta_propia === 2 ? texto("nombre_tercero", "Nombre del tercero", true, "") : null}

        <div className="cx-field">
          <span className="cx-label">
            ¿Es usted el propietario real, es decir, quien obtiene los beneficios de este contrato como verdadero dueño de
            los recursos?<span className="cx-req">*</span>
          </span>
          <SiNo name="propietario" value={form.propietario_real} onChange={(v) => set("propietario_real", v)} />
        </div>
        {form.propietario_real === 2 ? texto("nombre_propietario_real", "Nombre del propietario real", true, "") : null}
      </div>
    </PasoLayout>
  );
}

/* ----------------------------------------------------------------------- */
/* 6. Cuenta CLABE                                                          */
/* ----------------------------------------------------------------------- */

export function PasoClabe({ id, data, onBack, onSaved }: PasoProps) {
  const [clabe, setClabe] = useState(data.solicitud.clabe || "");
  const [validacion, setValidacion] = useState<ClabeValidacion | null>(null);
  const [revisando, setRevisando] = useState(false);
  const { guardar, guardando, error } = useGuardar(id, "clabe", onSaved);

  useEffect(() => {
    if (clabe.length !== 18) {
      setValidacion(null);
      return;
    }
    let activo = true;
    setRevisando(true);
    validateClabeRequest(clabe)
      .then((r) => activo && setValidacion(r))
      .catch(() => activo && setValidacion(null))
      .finally(() => activo && setRevisando(false));
    return () => {
      activo = false;
    };
  }, [clabe]);

  return (
    <PasoLayout
      titulo="Cuenta CLABE interbancaria"
      descripcion="Aquí depositaremos tu crédito. La cuenta debe estar a tu nombre."
      error={error}
      onBack={onBack}
      guardando={guardando}
      deshabilitado={!validacion?.correcto}
      onSubmit={() => guardar({ clabe }, () => (validacion?.correcto ? null : "Revisa tu CLABE."))}
    >
      <div className="cx-grid cx-grid-2">
        <Field label="CLABE (18 dígitos)" required help={`${clabe.length}/18`}>
          <input
            className={`cx-input ${validacion && !validacion.correcto ? "is-invalid" : ""}`}
            inputMode="numeric"
            maxLength={18}
            autoComplete="off"
            value={clabe}
            style={{ letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums" }}
            onChange={(e) => setClabe(e.target.value.replace(/\D/g, "").slice(0, 18))}
          />
        </Field>
        <Field label="Banco">
          <input className="cx-input" disabled value={validacion?.banco_nombre || data.solicitud.banco_nombre || ""} />
        </Field>
      </div>
      <div style={{ marginTop: 16 }}>
        {revisando ? <Alert tone="info">Revisando CLABE...</Alert> : null}
        {!revisando && validacion?.correcto ? <Alert tone="success">CLABE correcta — {validacion.banco_nombre}</Alert> : null}
        {!revisando && validacion && !validacion.correcto ? <Alert tone="error">{validacion.msg}</Alert> : null}
      </div>
    </PasoLayout>
  );
}

/* ----------------------------------------------------------------------- */
/* 7. Documentos                                                            */
/* ----------------------------------------------------------------------- */

export async function abrirDocumento(documentoId: number) {
  const ventana = window.open("", "_blank");
  try {
    const r = await getDocumentFileRequest(documentoId);
    if (r.url) {
      if (ventana) ventana.location.href = r.url;
      else window.location.href = r.url;
      return;
    }
    if (r.base64) {
      const bytes = Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: r.mime || "application/octet-stream" }));
      if (ventana) ventana.location.href = url;
      else window.open(url, "_blank");
    }
  } catch (err) {
    ventana?.close();
    alert(errorMessage(err, "No fue posible abrir el documento"));
  }
}

const ESTADO_DOC = {
  faltante: { tono: "danger", texto: "Pendiente" },
  renovar: { tono: "warning", texto: "Actualizar" },
  vigente: { tono: "success", texto: "Vigente" },
} as const;

export function PasoDocumentos({ id, data, onBack, onSaved, onRefresh }: PasoProps) {
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const inputs = useRef<Record<number, HTMLInputElement | null>>({});

  const subir = async (tipo: number, file?: File) => {
    if (!file) return;
    setError("");
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "jpg", "jpeg", "png"].includes(ext)) {
      setError("Solo se permiten archivos PDF, JPG o PNG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo no debe pesar más de 10 MB.");
      return;
    }
    setSubiendo(tipo);
    try {
      const base64 = await leerArchivoBase64(file);
      await uploadDocumentRequest({ tipo, nombre: file.name, base64 });
      await onRefresh();
    } catch (err) {
      setError(errorMessage(err, "No fue posible subir el documento"));
    } finally {
      setSubiendo(null);
      if (inputs.current[tipo]) inputs.current[tipo]!.value = "";
    }
  };

  const faltantes = data.documentos.filter((d) => d.estado === "faltante");

  const continuar = async () => {
    if (faltantes.length) {
      setError(`Sube los documentos pendientes: ${faltantes.map((d) => d.nombre).join(", ")}.`);
      return;
    }
    setGuardando(true);
    setError("");
    // Igual que el sistema actual: se guarda dispositivo y ubicación (si el cliente lo permite).
    const posicion = await new Promise<GeolocationPosition | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 8000 });
    });
    try {
      await saveApplicationSection(id, "dispositivo", {
        plataforma: navigator.platform,
        navegador: navigator.userAgent,
        latitud: posicion ? String(posicion.coords.latitude) : "",
        longitud: posicion ? String(posicion.coords.longitude) : "",
        precision: posicion ? String(posicion.coords.accuracy) : "",
      });
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <PasoLayout
      titulo="Documentos"
      descripcion="Sube tus documentos en PDF, JPG o PNG (máximo 10 MB). Los que ya estén vigentes no es necesario volver a subirlos."
      error={error}
      onBack={onBack}
      guardando={guardando}
      textoBoton="Continuar"
      deshabilitado={subiendo !== null}
      onSubmit={continuar}
    >
      <div className="cx-grid" style={{ gap: 10 }}>
        {data.documentos.length === 0 ? <Alert tone="info">Este producto no requiere documentos adicionales.</Alert> : null}
        {data.documentos.map((d, i) => {
          const estado = ESTADO_DOC[d.estado];
          return (
            <div key={d.tipo} className="cx-doc">
              <div>
                <p className="cx-doc-name">
                  {i + 1}. {d.nombre}
                </p>
                <p className="cx-doc-meta">
                  {d.descripcion || ""}
                  {d.fecha_vigencia ? ` Vigencia: ${formatFecha(d.fecha_vigencia)}` : ""}
                </p>
              </div>
              <div className="cx-doc-actions">
                <span className={`cx-badge cx-badge-${estado.tono}`}>{estado.texto}</span>
                {d.documento_id ? (
                  <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => abrirDocumento(d.documento_id!)}>
                    Ver
                  </button>
                ) : null}
                {d.estado !== "vigente" ? (
                  <>
                    <input
                      ref={(el) => {
                        inputs.current[d.tipo] = el;
                      }}
                      type="file"
                      className="cx-file-input"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => subir(d.tipo, e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      className="cx-btn cx-btn-primary cx-btn-sm"
                      disabled={subiendo !== null}
                      onClick={() => inputs.current[d.tipo]?.click()}
                    >
                      {subiendo === d.tipo ? "Subiendo..." : d.documento_id ? "Reemplazar" : "Subir"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </PasoLayout>
  );
}

/* ----------------------------------------------------------------------- */
/* 8. Autorización de Buró de Crédito                                       */
/* ----------------------------------------------------------------------- */

export function PasoBuro({ id, data, onBack, onSaved }: PasoProps) {
  const [password, setPassword] = useState("");
  const [acepto, setAcepto] = useState(data.buro_autorizado);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const autorizar = async () => {
    setError("");
    if (data.buro_autorizado) {
      await onSaved();
      return;
    }
    if (!acepto) return setError("Debes aceptar la autorización para continuar.");
    if (!password) return setError("Escribe tu contraseña para autorizar.");
    setGuardando(true);
    try {
      await authorizeBuroRequest(id, password);
      setPassword("");
      await onSaved();
    } catch (err) {
      setError(errorMessage(err, "No fue posible registrar la autorización"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <PasoLayout
      titulo="Autorización de consulta de historial de crédito"
      error={error}
      onBack={onBack}
      guardando={guardando}
      textoBoton={data.buro_autorizado ? "Continuar" : "Autorizar y continuar"}
      onSubmit={autorizar}
    >
      <div className="cx-legal">
        <p style={{ marginTop: 0 }}>
          Por este conducto autorizo expresamente a SUPPLY CREDIT DE MÉXICO, SOCIEDAD ANÓNIMA PROMOTORA DE INVERSIÓN DE
          CAPITAL VARIABLE, SOCIEDAD FINANCIERA DE OBJETO MÚLTIPLE, ENTIDAD NO REGULADA, para que por conducto de sus
          funcionarios facultados lleve a cabo investigaciones sobre mi comportamiento crediticio en las Sociedades de
          Información Crediticia que estime conveniente.
        </p>
        <p style={{ marginBottom: 0 }}>
          Asimismo, declaro que conozco la naturaleza y alcance de la información que se solicitará, del uso que SUPPLY
          CREDIT DE MÉXICO, S.A.P.I. DE C.V., SOFOM, E.N.R. hará de tal información y de que ésta podrá realizar
          consultas periódicas de mi historial crediticio, consintiendo que esta autorización se encuentre vigente por
          un período de 3 años contados a partir de la fecha de su expedición y, en todo caso, durante el tiempo que se
          mantenga la relación jurídica.
        </p>
      </div>

      {data.buro_autorizado ? (
        <div style={{ marginTop: 16 }}>
          <Alert tone="success">Ya autorizaste la consulta de Buró de Crédito para esta solicitud.</Alert>
        </div>
      ) : (
        <div className="cx-grid cx-grid-2" style={{ marginTop: 18, alignItems: "end" }}>
          <label className={`cx-radio ${acepto ? "is-checked" : ""}`} style={{ alignSelf: "stretch" }}>
            <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
            Acepto y autorizo la consulta
          </label>
          <Field label="Para autorizar, ingresa nuevamente tu contraseña" required>
            <input
              className="cx-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>
      )}
    </PasoLayout>
  );
}

/* ----------------------------------------------------------------------- */
/* 9. Enviar                                                                */
/* ----------------------------------------------------------------------- */

export function PasoEnviar({
  id,
  data,
  onBack,
  onEnviada,
}: PasoProps & { onEnviada: (r: EnvioResultado) => void }) {
  const [aceptoIne, setAceptoIne] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const pendientes = data.pasos.filter((p) => p.clave !== "enviar" && !p.completo);
  const s = data.solicitud;

  const enviar = async () => {
    setError("");
    if (pendientes.length) return setError("Completa los pasos pendientes antes de enviar.");
    if (!aceptoIne) return setError("Acepta la consulta de tus datos ante el INE para enviar la solicitud.");
    setEnviando(true);
    try {
      const r = await sendApplicationRequest(id);
      if (r.public_url) {
        window.location.href = r.public_url;
        return;
      }
      onEnviada(r);
    } catch (err) {
      setError(errorMessage(err, "No fue posible enviar la solicitud"));
      setEnviando(false);
    }
  };

  return (
    <PasoLayout
      titulo="Revisa y envía tu solicitud"
      descripcion="Al enviar, validaremos tu identidad con tu INE (si no tienes una INE vigente registrada) y tu solicitud pasará a revisión."
      error={error}
      onBack={onBack}
      guardando={enviando}
      textoBoton={enviando ? "Enviando..." : "Enviar solicitud"}
      onSubmit={enviar}
    >
      <div className="cx-grid cx-grid-4">
        <div className="cx-stat">
          <p className="cx-stat-label">Monto</p>
          <p className="cx-stat-value">{formatMoney(s.monto_credito)}</p>
        </div>
        <div className="cx-stat">
          <p className="cx-stat-label">Pagos</p>
          <p className="cx-stat-value">
            {s.total_pagos} <small style={{ fontSize: "0.8rem", fontWeight: 500 }}>{pagosLabel(s.periodicidad)}</small>
          </p>
        </div>
        <div className="cx-stat">
          <p className="cx-stat-label">Pago periódico</p>
          <p className="cx-stat-value">{formatMoney(s.monto_pago)}</p>
        </div>
        <div className="cx-stat">
          <p className="cx-stat-label">CLABE</p>
          <p className="cx-stat-value" style={{ fontSize: "1rem" }}>
            {s.clabe || "—"}
            <br />
            <small style={{ fontWeight: 500, color: "var(--cx-muted)" }}>{s.banco_nombre || ""}</small>
          </p>
        </div>
      </div>

      {pendientes.length ? (
        <div style={{ marginTop: 16 }}>
          <Alert tone="warning">
            Falta completar:
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {pendientes.map((p) => (
                <li key={p.clave}>{p.faltantes.join(", ")}</li>
              ))}
            </ul>
          </Alert>
        </div>
      ) : null}

      <label className={`cx-radio ${aceptoIne ? "is-checked" : ""}`} style={{ marginTop: 18, display: "flex" }}>
        <input type="checkbox" checked={aceptoIne} onChange={(e) => setAceptoIne(e.target.checked)} />
        Acepto que se consulten mis datos ante el Instituto Nacional Electoral (INE).
      </label>
    </PasoLayout>
  );
}
