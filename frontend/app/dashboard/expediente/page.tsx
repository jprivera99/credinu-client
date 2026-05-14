"use client";

function Check({ ok }: { ok: boolean }) {
  return ok
    ? <span style={{ color: "#22a84a", fontWeight: 700 }}>✔</span>
    : <span style={{ color: "#c4372f", fontWeight: 700 }}>✖</span>;
}

const demo = {
  cliente: {
    id: "12345",
    nombre: "Juan Pérez García",
    empresa: "MTK",
    curp: "PEPJ800101HDFRRN09",
    rfc: "PEPJ800101XXX",
    telefono: "555-123-4567",
    correo: "juan.perez@email.com",
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
    pago: 600,
    tipo: "Nómina",
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
              <tr><td className="exp-label">Pago periódico</td><td>{fmt(solicitud.pago)}</td></tr>
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
        <p className="hero-kicker" style={{ padding: "18px 24px 4px", margin: 0 }}>Documentación</p>
        <h3 style={{ margin: "0 0 4px", padding: "0 24px 14px", borderBottom: "1px solid var(--line)" }}>
          Checklist del expediente
        </h3>
        <table className="portal-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th style={{ textAlign: "center" }}>Vigente</th>
              <th style={{ textAlign: "center" }}>Revisado</th>
              <th style={{ textAlign: "center" }}>Mostrar</th>
              <th style={{ textAlign: "center" }}>Adjunto</th>
            </tr>
          </thead>
          <tbody>
            {checklist.map((doc, i) => (
              <tr key={i}>
                <td>{doc.nombre}</td>
                <td style={{ textAlign: "center" }}><Check ok={doc.vigente} /></td>
                <td style={{ textAlign: "center" }}><Check ok={doc.revisado} /></td>
                <td style={{ textAlign: "center" }}><Check ok={doc.mostrar} /></td>
                <td style={{ textAlign: "center" }}><Check ok={doc.adjunto} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Validaciones */}
      <div className="exp-grid">
        <div className="table-card">
          <p className="hero-kicker" style={{ margin: "0 0 6px" }}>Firma electrónica</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Check ok={false} />
            <span>Pendiente de firma</span>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Creado</span>
            <button className="exp-btn-link">Ver detalle</button>
          </div>
        </div>
        <div className="table-card">
          <p className="hero-kicker" style={{ margin: "0 0 6px" }}>Validación documental</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Check ok={true} />
            <span>Validado</span>
            <button className="exp-btn-link">Ver detalle</button>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="table-card" style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button className="exp-btn-link">✉ Enviar por email</button>
        <button className="exp-btn-danger">✕ Rechazar solicitud</button>
      </div>

      <style jsx>{`
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
                .exp-btn-action--sm {
                  padding: 3px 10px;
                  font-size: 0.78rem;
                  margin-left: 6px;
                  vertical-align: middle;
                }
                .exp-btn-action--green {
                  color: #1a7a2a;
                  border-color: #22a84a;
                }
                .exp-btn-action--green:hover {
                  border-color: #1a7a2a;
                  background: rgba(34,168,74,0.06);
                }
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
      `}</style>
    </section>
  );
}
