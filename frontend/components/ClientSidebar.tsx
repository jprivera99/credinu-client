"use client";

import Link from "next/link";
import type { AuthUser } from "@/lib/types";

type IconType = "grid" | "calc" | "file" | "wallet" | "user";

interface NavItem {
  href: string;
  label: string;
  icon: IconType;
  /** Rutas hijas que también marcan el menú como activo */
  match?: string[];
}

// Mismo menú que el cliente ve en el sistema actual.
const items: NavItem[] = [
  { href: "/dashboard/productos", label: "Productos", icon: "grid" },
  { href: "/dashboard/cotizacion", label: "Cotizador", icon: "calc" },
  {
    href: "/dashboard/mis-solicitudes",
    label: "Solicitudes de Crédito",
    icon: "file",
    match: ["/dashboard/solicitud"],
  },
  { href: "/dashboard/prestamos", label: "Mis Préstamos", icon: "wallet" },
  { href: "/dashboard/mis-datos", label: "Mis Datos", icon: "user" },
];

interface ClientSidebarProps {
  pathname: string;
  user: AuthUser | null;
  open: boolean;
  onClose: () => void;
}

function Icon({ type }: { type: IconType }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "grid":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "calc":
      return (
        <svg {...props}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M8 6h8" />
          <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4" />
        </svg>
      );
    case "file":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6M9 17h6" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...props}>
          <path d="M3 7a2 2 0 0 1 2-2h14v4" />
          <path d="M3 7v10a2 2 0 0 0 2 2h16V9H5a2 2 0 0 1-2-2z" />
          <circle cx="16.5" cy="14" r="1" />
        </svg>
      );
    case "user":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="11" r="2.5" />
          <path d="M5.5 17c.8-1.8 2-2.5 3.5-2.5s2.7.7 3.5 2.5M15 10h3M15 14h3" />
        </svg>
      );
  }
}

export function ClientSidebar({ pathname, user, open, onClose }: ClientSidebarProps) {
  const isActive = (item: NavItem) =>
    pathname === item.href ||
    pathname.startsWith(item.href + "/") ||
    (item.match || []).some((m) => pathname.startsWith(m));

  return (
    <>
      <aside className={"portal-sidebar " + (open ? "is-open" : "")}>
        <div className="portal-brand">
          <div>
            <p className="portal-brand-wordmark" aria-label="CredinU">
              <span className="portal-brand-wordmark-left">Credi</span>
              <span className="portal-brand-wordmark-right">nU</span>
            </p>
          </div>
        </div>

        <div className="portal-user">
          <p className="portal-user-label">Menú del cliente</p>
          <p className="portal-user-name">{user?.nombre ?? "Cargando..."}</p>
        </div>

        <nav className="portal-nav">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={"portal-nav-item " + (isActive(item) ? "is-active" : "")}
              onClick={onClose}
            >
              <Icon type={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {open ? <button type="button" className="portal-backdrop" onClick={onClose} aria-label="Cerrar menú" /> : null}
    </>
  );
}
