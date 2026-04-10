"use client";

import Link from "next/link";
import type { AuthUser } from "@/lib/types";

interface NavItem {
    href: string;
    label: string;
    icon: "grid" | "file" | "user" | "lock" | "wallet";
    disabled?: boolean;
}

const items: NavItem[] = [
    { href: "/dashboard/productos", label: "Productos", icon: "grid" },
    {
        href: "/dashboard/solicitudes",
        label: "Solicitudes de Crédito",
        icon: "file",
    },
    { href: "/dashboard/mis-datos", label: "Mis Datos", icon: "user" },
    {
        href: "/dashboard/cambiar-password",
        label: "Cambiar Contraseña",
        icon: "lock",
    },
    {
        href: "/dashboard/prestamos",
        label: "Mis Préstamos",
        icon: "wallet",
        disabled: true,
    },
];

interface ClientSidebarProps {
    pathname: string;
    user: AuthUser | null;
    open: boolean;
    onClose: () => void;
    onLogout: () => void;
}

function Icon({ type }: { type: NavItem["icon"] }) {
    const props = {
        width: 18,
        height: 18,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
    };

    switch (type) {
        case "grid":
            return (
                <svg {...props}>
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                </svg>
            );
        case "file":
            return (
                <svg {...props}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                </svg>
            );
        case "user":
            return (
                <svg {...props}>
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            );
        case "lock":
            return (
                <svg {...props}>
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                </svg>
            );
        case "wallet":
            return (
                <svg {...props}>
                    <path d="M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3z" />
                    <path d="M16 13h5" />
                </svg>
            );
    }
}

export function ClientSidebar({
    pathname,
    user,
    open,
    onClose,
    onLogout,
}: ClientSidebarProps) {
    return (
        <>
            <aside className={"portal-sidebar " + (open ? "is-open" : "")}>
                <div className="portal-brand">
                    <span className="portal-brand-mark">CR</span>
                    <div>
                        <p className="portal-brand-title">CredinU</p>
                        <p className="portal-brand-copy">Portal del cliente</p>
                    </div>
                </div>

                <div className="portal-user">
                    <p className="portal-user-label">Menu del cliente</p>
                    <p className="portal-user-name">{user?.nombre ?? "Cargando..."}</p>
                </div>

                <nav className="portal-nav">
                    {items.map((item) => {
                        if (item.disabled) {
                            return (
                                <div key={item.href} className="portal-nav-item is-disabled">
                                    <Icon type={item.icon} />
                                    <span>{item.label}</span>
                                </div>
                            );
                        }

                        const active = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={"portal-nav-item " + (active ? "is-active" : "")}
                                onClick={onClose}
                            >
                                <Icon type={item.icon} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <button type="button" className="portal-logout" onClick={onLogout}>
                    Salir
                </button>
            </aside>

            {open ? (
                <button type="button" className="portal-backdrop" onClick={onClose} />
            ) : null}
        </>
    );
}