"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { AuthUser } from "@/lib/types";

interface ClientTopbarProps {
    user: AuthUser | null;
    onMenu: () => void;
    onLogout: () => void;
}

export function ClientTopbar({ user, onMenu, onLogout }: ClientTopbarProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const initials = useMemo(() => {
        const raw = user?.nombre?.trim();
        if (!raw) return "U";
        const parts = raw.split(/\s+/);
        const first = parts[0]?.[0] ?? "";
        const second = parts[1]?.[0] ?? "";
        return (first + second).toUpperCase();
    }, [user?.nombre]);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    return (
        <header className="portal-topbar">
            <button
                type="button"
                className="portal-menu-button"
                onClick={onMenu}
                aria-label="Abrir menu"
            >
                <span />
                <span />
                <span />
            </button>

            <div className="portal-topbar-title">
                <p className="portal-mini-wordmark" aria-label="CredinU">
                    <span className="portal-mini-wordmark-left">Credi</span>
                    <span className="portal-mini-wordmark-right">nU</span>
                </p>
                <h1 className="portal-heading">Bienvenido a tu portal</h1>
            </div>

            <div className="user-menu" ref={containerRef}>
                <button
                    type="button"
                    className="user-menu-trigger"
                    onClick={() => setOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={open}
                >
                    <span className="user-avatar">{initials}</span>
                    <span className="user-name">{user?.usuario ?? "demo.cliente"}</span>
                </button>

                {open ? (
                    <div className="user-dropdown" role="menu">
                        <Link href="/dashboard/mis-datos" className="user-dropdown-item" onClick={() => setOpen(false)}>
                            Mis datos
                        </Link>
                        <Link href="/dashboard/cambiar-password" className="user-dropdown-item" onClick={() => setOpen(false)}>
                            Cambiar contraseña
                        </Link>
                        <button
                            type="button"
                            className="user-dropdown-item danger"
                            onClick={() => {
                                setOpen(false);
                                onLogout();
                            }}
                        >
                            Salir
                        </button>
                    </div>
                ) : null}
            </div>
        </header>
    );
}