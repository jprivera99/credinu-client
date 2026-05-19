"use client";

function Check({ ok }: { ok: boolean }) {
  return ok
    ? <span style={{ color: "#22a84a", fontWeight: 700 }}>✔</span>
    : <span style={{ color: "#c4372f", fontWeight: 700 }}>✖</span>;
}

const demo = {
  cliente: {
    id: "12678",
    nombre: "Pedro Gonzalez Pérez",
    empresa: "MTK",
    curp: "PEPJ800101HDFRRN09",
    rfc: "PEPJ800101XXX",
    telefono: "555-123-4567",
    correo: "pedro.gonzalez@email.com",
    idRemtool: "183717a0-1652-4759-955d-f275792cf7ba",
    clabe: "002010077777777771",
    v: { curp: true, rfc: true, nombre: true, telefono: true, correo: false, clabe: true, ine: true },
  },
  solicitud: {
    numero: "16540",
    producto: "Efectivo Inmediato",
    comercial: "Efectivo Inmediato Pagos Semanales",
    monto: 15000,
    autorizado: 12000,
    periodicidad: "Semanal",
    pagos: 24,
    estatus: "Documentos en validación",
    fecha: "2026-05-14",
    pago: "5 descuentos de $500 cada uno",
    tipo: "Crédito nuevo",
    clabe: "002010077777777771",
    banco: "BBVA",
  },
  checklist: [
    { nombre: "Identificación oficial (INE)", vigente: true,  revisado: true,  mostrar: true,  adjunto: true  },
    { nombre: "Comprobante de domicilio",     vigente: true,  revisado: false, mostrar: true,  adjunto: false },
    { nombre: "Recibo de nómina",             vigente: false, revisado: false, mostrar: false, adjunto: false },
    { nombre: "Estado de cuenta bancario",    vigente: true,  revisado: true,  mostrar: true,  adjunto: true  },
  ],
};

export default function ExpedientePage() {
  const { cliente, solicitud, checklist } = demo;
  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  return (
    <section className="portal-stack">

      {/* Encabezado */}
      <div className="hero-panel">
        <div>
          <p className="hero-kicker">Solicitud {solicitud.numero}</p>
          <h2>Expediente de crédito</h2>
          <p>Revisa y valida la información del cliente y la solicitud.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        </div>
      </div>

      {/* Grid dos columnas */}
      <div className="exp-grid">

        {/* Datos del cliente */}
        <div className="table-card" style={{ padding: 0 }}>
          <p className="hero-kicker" style={{ padding: "18px 24px 4px", margin: 0 }}>Cliente</p>
          <h3 style={{ margin: "0 0 4px", padding: "0 24px 14px", borderBottom: "1px solid var(--line)" }}>
            Datos del cliente
          </h3>
          <table className="portal-table">
            <tbody>
              <tr><td className="exp-label">N.º cliente</td><td>{cliente.id}</td></tr>
              <tr><td className="exp-label">RFC</td><td>{cliente.rfc} <Check ok={cliente.v.rfc} /></td></tr>
              <tr><td className="exp-label">CURP</td><td>{cliente.curp} <Check ok={cliente.v.curp} /></td></tr>
              <tr><td className="exp-label">Cliente</td><td>{cliente.nombre} <Check ok={cliente.v.nombre} /></td></tr>
              <tr><td className="exp-label">Empresa</td><td>{cliente.empresa}</td></tr>
              <tr><td className="exp-label">Email</td><td>{cliente.correo} <Check ok={cliente.v.correo} /></td></tr>
              <tr><td className="exp-label">Teléfono</td><td>{cliente.telefono} <Check ok={cliente.v.telefono} /><button className="exp-btn-action exp-btn-action--sm">Cambiar núm. teléfono</button></td></tr>
              <tr>
                <td className="exp-label">ID Remtool</td>
                <td>
                  <span className="exp-uuid">{cliente.idRemtool}</span>
                  <button className="exp-btn-action exp-btn-action--sm">Ver validaciones</button>
                </td>
              </tr>
              <tr>
                <td className="exp-label">Validación INE</td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Check ok={cliente.v.ine} /> Validado
                    <button className="exp-btn-action exp-btn-action--sm">Ver validación</button>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Datos de la solicitud */}
        <div className="table-card" style={{ padding: 0 }}>
          <p className="hero-kicker" style={{ color: "#c4372f", padding: "18px 24px 4px", margin: 0 }}>Solicitud</p>
          <h3 style={{ margin: "0 0 4px", padding: "0 24px 14px", borderBottom: "1px solid var(--line)" }}>
            Datos de la solicitud
          </h3>
          <table className="portal-table">
            <tbody>
              <tr><td className="exp-label">N.º solicitud</td><td>{solicitud.numero}</td></tr>
              <tr>
                <td className="exp-label">Cuenta CLABE</td>
                <td>
                  <span className="exp-uuid">{solicitud.clabe}</span>
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}> ({solicitud.banco})</span>
                  <Check ok={cliente.v.clabe} />
                  <button className="exp-btn-action exp-btn-action--sm">Validar</button>
                  <button className="exp-btn-action exp-btn-action--sm exp-btn-action--green">Detonar CEP</button>
                </td>
              </tr>
              <tr><td className="exp-label">Monto</td><td>{fmt(solicitud.monto)}</td></tr>
              <tr><td className="exp-label">Monto autorizado</td><td>{fmt(solicitud.autorizado)}</td></tr>
              <tr><td className="exp-label">Producto</td><td>{solicitud.producto}</td></tr>
              <tr><td className="exp-label">Nombre comercial</td><td>{solicitud.comercial}</td></tr>
              <tr><td className="exp-label">Periodicidad</td><td>{solicitud.periodicidad}</td></tr>
              <tr><td className="exp-label">N.º pagos</td><td>{solicitud.pagos}</td></tr>
              <tr>
                <td className="exp-label">Estatus</td>
                <td><span className="product-pill">{solicitud.estatus}</span></td>
              </tr>
              <tr><td className="exp-label">Pago periódico</td><td>{solicitud.pago}</td></tr>
              <tr><td className="exp-label">Tipo de solicitud</td><td>{solicitud.tipo}</td></tr>
            </tbody>
          </table>
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line)", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="exp-btn-action">Tabla amortización</button>
            <button className="exp-btn-action">Cotizador</button>
            <button className="exp-btn-action">Historial de buró</button>
            <button className="exp-btn-action">Edo. cuenta portabilidad</button>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="table-card" style={{ padding: 0 }}>
        <p className="hero-kicker" style={{ padding: "18px 24px 4px", margin: 0 }}>Documentos personales</p>
        <h3 style={{ margin: "0 0 4px", padding: "0 24px 14px", borderBottom: "1px solid var(--line)" }}>
          Checklist del expediente
        </h3>
        <table className="portal-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th style={{ textAlign: "center" }}>Revisar</th>
              <th style={{ textAlign: "center" }}>Vigencia</th>
              <th style={{ textAlign: "center" }}>Mostrar</th>
              <th style={{ textAlign: "center" }}>Adjunta documento</th>
            </tr>
          </thead>
          <tbody>
            {checklist.map((doc, i) => (
              <tr key={i}>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Check ok={doc.vigente} /> {doc.nombre}
                  </span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <select defaultValue={doc.revisado ? "completo" : "incompleto"} className="exp-select">
                    <option value="completo">Completo</option>
                    <option value="incompleto">Incompleto</option>
                  </select>
                </td>
                <td style={{ textAlign: "center" }}>
                  <input type="date" className="exp-date" defaultValue="2026-05-18" />
                </td>
                <td style={{ textAlign: "center" }}>
                  <button className="exp-btn-icon" title="Ver documento"><span role="img" aria-label="hoja">📄</span></button>
                </td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Checklist del expediente de crédito */}
      <div className="table-card" style={{ padding: 0, marginTop: 32 }}>
        <p className="hero-kicker" style={{ padding: "18px 24px 4px", margin: 0 }}>Expediente de crédito</p>
        <h3 style={{ margin: "0 0 4px", padding: "0 24px 14px", borderBottom: "1px solid var(--line)" }}>
          Checklist del expediente de crédito
        </h3>
        <table className="portal-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th style={{ textAlign: "center" }}>Editar</th>
              <th style={{ textAlign: "center" }}>Imprime</th>
            </tr>
          </thead>
          <tbody>
            {/* Documentos checklist */}
            {[
              { nombre: "Solicitud de crédito", validado: true, porcentaje: "90.0%" },
              { nombre: "Autorización para solicitar reportes de crédito", validado: true, porcentaje: "100%" },
              { nombre: "Autorización para domiciliación de recursos", validado: true, porcentaje: "100%" },
              { nombre: "Contrato múltiple para la apertura de créditos", validado: true, porcentaje: "100%" },
              { nombre: "Carátula de crédito", validado: true, porcentaje: "100%" },
              { nombre: "Pagaré", validado: true, porcentaje: "100%" },
              { nombre: "Carta de instrucción irrevocable de descuento de nómina y pago a supplycredit", validado: true, porcentaje: "100%" },
              { nombre: "Pagaré verde", validado: true, porcentaje: "100%" },
              { nombre: "Autorización expresa de uso de firma digital", validado: true, porcentaje: "100%" },
              { nombre: "Tabla de amortización", validado: true, porcentaje: "100%" },
            ].map((item, i) => (
              <tr key={i}>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Check ok={item.validado} /> {item.nombre}
                    <span style={{ color: "#888", fontSize: "0.92em", marginLeft: 8 }}>{item.porcentaje}</span>
                  </span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <button className="exp-btn-icon" title="Editar"><span role="img" aria-label="editar">✏️</span></button>
                </td>
                <td style={{ textAlign: "center" }}>
                  <button className="exp-btn-icon" title="Imprimir"><span role="img" aria-label="imprimir">🖨️</span></button>
                </td>
              </tr>
            ))}
            {/* Fila especial: Firma electrónica */}
            <tr>
              <td>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <a href="#" style={{ color: "var(--accent)", textDecoration: "underline" }}>Firma electrónica (enlace abierto)</a>
                  <button className="exp-btn-icon" title="Copiar enlace"><span role="img" aria-label="copiar">📋</span></button>
                </span>
              </td>
              <td style={{ textAlign: "center" }}></td>
              <td style={{ textAlign: "center" }}></td>
            </tr>
            {/* Fila especial: Validación documental */}
            <tr>
              <td>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Check ok={true} /> Validación documental (success)
                </span>
              </td>
              <td style={{ textAlign: "center" }}></td>
              <td style={{ textAlign: "center" }}></td>
            </tr>
          </tbody>
        </table>
        <div style={{ padding: "18px 24px 18px", textAlign: "right" }}>
          <button className="exp-btn-action exp-btn-action--green">Docs</button>
        </div>
      </div>

        {/* Documentos firmados en sucursal */}
        <div className="table-card" style={{ padding: 0, marginTop: 32 }}>
          <p className="hero-kicker" style={{ padding: "18px 24px 4px", margin: 0 }}>Documentos firmados en sucursal</p>
          <h3 style={{ margin: "0 0 4px", padding: "0 24px 14px", borderBottom: "1px solid var(--line)" }}>
            Documentos firmados en sucursal
          </h3>
          <table className="portal-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Descripción</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input type="file" className="exp-file" />
                </td>
                <td>
                  <select className="exp-select">
                    <option defaultValue="0" selected>--Seleccione--</option>
                    <option value="693">Autorización expresa de uso de firma digital</option>
                    <option value="655">Autorización para Domiciliación de Recursos</option>
                    <option value="654">Autorización para solicitar Reportes de Crédito</option>
                    <option value="657">Carátula de Crédito</option>
                    <option value="702">Carta Bajo Protesta</option>
                    <option value="692">Carta Comprobación De La Realización De La Mejora De Vivienda</option>
                    <option value="659">Carta de Aceptación del Fideicomiso Maestro Irrevocable de Garantía y Medio de pago de los Programas de Financiamiento</option>
                    <option value="660">Carta de Instrucción Irrevocable de Descuento de Nómina y Pago a Supply Credit</option>
                    <option value="656">Contrato Múltiple para la apertura de Créditos</option>
                    <option value="658">Pagaré</option>
                    <option value="661">Otro</option>
                    <option value="653">Solicitud Crédito</option>
                    <option value="710">Tabla de Amortización</option>
                  </select>
                </td>
                <td style={{ textAlign: "center" }}>
                  <button className="exp-btn-action">Adjuntar documento</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Documentos adjuntados */}
        <div className="table-card" style={{ padding: 0, marginTop: 20 }}>
          <p className="hero-kicker" style={{ padding: "18px 24px 4px", margin: 0 }}>Documentos adjuntados</p>
          <h3 style={{ margin: "0 0 4px", padding: "0 24px 14px", borderBottom: "1px solid var(--line)" }}>
            Documentos cargados
          </h3>
          <table className="portal-table">
            <thead className="tabla_encabezado">
              <tr>
                <th className="text-center">Descripción</th>
                <th className="text-center">Fecha Carga</th>
                <th className="text-center">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: "center", color: "var(--muted)" }}>Sin documentos adjuntados</td>
                <td style={{ textAlign: "center", color: "var(--muted)" }}>-</td>
                <td style={{ textAlign: "center" }}>-</td>
              </tr>
            </tbody>
          </table>
        </div>

      {/* Estatus */}
      <div className="table-card" style={{ padding: 0, marginTop: 24 }}>
        <p className="hero-kicker" style={{ padding: "18px 24px 4px", margin: 0 }}>Estatus</p>
        <h3 style={{ margin: "0 0 4px", padding: "0 24px 14px", borderBottom: "1px solid var(--line)" }}>
          Estatus de la solicitud
        </h3>
        <div className="exp-status-toolbar" role="toolbar" aria-label="Toolbar with button groups">
          <button type="button" className="exp-btn-action exp-btn-action--green exp-btn-action--md">Enviar Solicitud</button>
          <button type="button" className="exp-btn-action exp-btn-action--green exp-btn-action--md">Doc. en Revisión</button>
          <button type="button" className="exp-btn-action exp-btn-action--green exp-btn-action--md">Doc. en Análisis</button>
          <button type="button" className="exp-btn-action exp-btn-action--green exp-btn-action--md">Firma Autógrafa</button>
          <button type="button" className="exp-btn-danger exp-btn-action--md">Devolución</button>
          <button type="button" className="exp-btn-action exp-btn-action--green exp-btn-action--md">Corregido</button>
          <button type="button" className="exp-btn-danger exp-btn-action--md">Error de Captura</button>
          <button type="button" className="exp-btn-danger exp-btn-action--md">Rechazar</button>
          <button type="button" className="exp-btn-danger exp-btn-action--md">Cancelar</button>
        </div>
      </div>

      <style jsx>{`
        .exp-select {
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid var(--line);
          font-size: 0.95em;
        }
        .exp-date {
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid var(--line);
          font-size: 0.95em;
        }
        .exp-file {
          width: 100%;
          max-width: 390px;
          font-size: 0.88rem;
          color: var(--muted);
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 6px;
        }
        .exp-file::file-selector-button {
          margin-right: 10px;
          padding: 8px 14px;
          border: 1px dashed var(--accent);
          border-radius: 8px;
          background: rgba(31,94,255,0.06);
          color: var(--accent);
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .exp-file::file-selector-button:hover {
          background: rgba(31,94,255,0.12);
          border-color: var(--accent-2);
        }
        .exp-btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.15em;
          padding: 2px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .exp-btn-icon:hover {
          background: #f3f6fa;
        }
        .exp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 860px) {
          .exp-grid { grid-template-columns: 1fr; }
        }
        .exp-label {
          color: var(--muted);
          font-size: 0.88rem;
          white-space: nowrap;
          width: 160px;
        }
        .exp-btn-link {
          background: none;
          border: none;
          color: var(--accent);
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0 6px;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .exp-btn-link--accent {
          color: #22a84a;
        }
        .exp-btn-action {
          background: none;
          border: 1px solid var(--line);
          border-radius: 10px;
          color: var(--accent);
          cursor: pointer;
          font-size: 0.82rem;
          padding: 6px 14px;
          transition: border-color 0.15s, background 0.15s;
        }
        .exp-btn-action:hover {
          border-color: var(--accent);
          background: rgba(31,94,255,0.05);
        }
        .exp-btn-action--sm {
          padding: 3px 10px;
          font-size: 0.78rem;
          margin-left: 6px;
          vertical-align: middle;
        }
        .exp-btn-action--md {
          padding: 8px 14px;
          font-size: 0.84rem;
          font-weight: 600;
        }
        .exp-btn-action--green {
          color: #1a7a2a;
          border-color: #22a84a;
          background: rgba(34,168,74,0.04);
        }
        .exp-btn-action--green:hover {
          border-color: #1a7a2a;
          background: rgba(34,168,74,0.1);
        }
        .exp-uuid {
          font-family: monospace;
          font-size: 0.82rem;
          color: var(--muted);
          word-break: break-all;
        }
        .exp-btn-danger {
          background: none;
          border: 1px solid #c4372f;
          color: #c4372f;
          border-radius: 12px;
          padding: 10px 18px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: background 0.15s;
        }
        .exp-btn-danger:hover { background: #fbeaea; }
        .exp-status-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          padding: 16px 20px 22px;
        }
        .text-center { text-align: center; }
      `}</style>
    </section>
  );
}
