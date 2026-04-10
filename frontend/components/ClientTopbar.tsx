"use client";

import type { AuthUser } from "@/lib/types";

interface ClientTopbarProps {
    user: AuthUser | null;
    onMenu: () => void;
}

export function ClientTopbar({ user, onMenu }: ClientTopbarProps) {
    return (
        <header className="portal-topbar">
            <button type="button" className="portal-menu-button" onClick={onMenu} aria-label="Abrir menu" >
                <span />
                <span />
                <span />
            </button>

            <div>
                <p className="portal-kicker">Cliente</p>
                <h1 className="portal-heading">Bienvenido a tu portal</h1>
            </div>

            <div className="portal-chip">
                <span className="portal-chip-dot" />
                {user?.usuario ?? "Conectando"}
            </div>
        </header>
    );
}