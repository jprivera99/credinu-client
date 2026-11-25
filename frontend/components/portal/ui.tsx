"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { FilaAmortizacion } from "@/lib/solicitud";
import { estatusTono, formatFecha, formatMoney } from "@/lib/solicitud";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="cx-page-header">
      <div>
        {eyebrow ? <p className="cx-eyebrow">{eyebrow}</p> : null}
        <h2 className="cx-title">{title}</h2>
        {subtitle ? <p className="cx-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  text,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  text?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`cx-card ${className}`}>
      {title || actions ? (
        <div className="cx-card-header">
          <div>
            {title ? <h3 className="cx-card-title">{title}</h3> : null}
            {text ? <p className="cx-card-text">{text}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Field({
  label,
  required,
  help,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  help?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`cx-field ${className}`}>
      <span className="cx-label">
        {label}
        {required ? <span className="cx-req">*</span> : null}
      </span>
      {children}
      {help ? <span className="cx-help">{help}</span> : null}
    </label>
  );
}

export function SelectCatalogo({
  value,
  onChange,
  options,
  placeholder = "Seleccione",
  disabled,
}: {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  options: { id: number; nombre: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select
      className="cx-select"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.nombre}
        </option>
      ))}
    </select>
  );
}

export function SiNo({
  value,
  onChange,
  name,
  disabled,
}: {
  value: number | null;
  onChange: (v: number) => void;
  name: string;
  disabled?: boolean;
}) {
  return (
    <div className="cx-radio-group" role="radiogroup">
      {[
        { v: 1, t: "Sí" },
        { v: 2, t: "No" },
      ].map((o) => (
        <label key={o.v} className={`cx-radio ${value === o.v ? "is-checked" : ""}`}>
          <input
            type="radio"
            name={name}
            checked={value === o.v}
            disabled={disabled}
            onChange={() => onChange(o.v)}
          />
          {o.t}
        </label>
      ))}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "warning" | "error"; children: ReactNode }) {
  return (
    <div className={`cx-alert cx-alert-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <div>{children}</div>
    </div>
  );
}

export function Loading({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="cx-card cx-empty">
      <div className="cx-spinner" />
      {text}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="cx-card cx-empty">
      <h3>{title}</h3>
      {text ? <p style={{ margin: "0 0 16px" }}>{text}</p> : null}
      {action}
    </div>
  );
}

export function StatusBadge({ estatusId, text }: { estatusId: number; text?: string | null }) {
  return <span className={`cx-badge cx-badge-${estatusTono(estatusId)}`}>{text || "Sin estatus"}</span>;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  actions,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="cx-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="cx-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div>{children}</div>
        <div className="cx-modal-actions">
          {actions ?? (
            <button type="button" className="cx-btn cx-btn-primary" onClick={onClose}>
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TablaAmortizacion({ filas, completa = true }: { filas: FilaAmortizacion[]; completa?: boolean }) {
  const [verTodo, setVerTodo] = useState(false);
  if (!filas.length) return <p className="cx-card-text">Sin tabla de pagos.</p>;

  const visibles = verTodo || filas.length <= 12 ? filas : filas.slice(0, 12);
  const conFecha = filas.some((f) => f.fecha);

  return (
    <>
      <div className="cx-table-wrap">
        <table className="cx-table">
          <thead>
            <tr>
              <th>#</th>
              {conFecha ? <th>Fecha</th> : null}
              {completa ? <th className="cx-num">Saldo inicial</th> : null}
              {completa ? <th className="cx-num">Capital</th> : null}
              {completa ? <th className="cx-num">Interés</th> : null}
              {completa ? <th className="cx-num">IVA</th> : null}
              <th className="cx-num">Pago</th>
              {completa ? <th className="cx-num">Saldo final</th> : null}
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={f.periodo}>
                <td>{f.periodo}</td>
                {conFecha ? <td>{formatFecha(f.fecha)}</td> : null}
                {completa ? <td className="cx-num">{formatMoney(f.saldo_inicial)}</td> : null}
                {completa ? <td className="cx-num">{formatMoney(f.capital)}</td> : null}
                {completa ? <td className="cx-num">{formatMoney(f.interes)}</td> : null}
                {completa ? <td className="cx-num">{formatMoney(f.iva)}</td> : null}
                <td className="cx-num">
                  <b>{formatMoney(f.pago)}</b>
                </td>
                {completa ? <td className="cx-num">{formatMoney(f.saldo_final)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filas.length > 12 ? (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button type="button" className="cx-btn-link" onClick={() => setVerTodo((v) => !v)}>
            {verTodo ? "Ver menos" : `Ver los ${filas.length} pagos`}
          </button>
        </div>
      ) : null}
    </>
  );
}

export const errorMessage = (err: unknown, fallback = "Ocurrió un error. Intenta de nuevo.") =>
  err instanceof Error && err.message ? err.message : fallback;
