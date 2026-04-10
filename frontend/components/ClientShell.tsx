"use client";
import { useEffect, useState} from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMe } from "@/lib/api";
import { AuthUser } from "@/lib/types";
import { ClientSidebar } from "@/components/ClientSidebar";
import { ClientTopbar } from "@/components/ClientTopbar";

interface ClientShellProps {
    children: React.ReactNode;
}

export function ClientShell({ children}: ClientShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.replace("/login");
            return;
        }

        getMe()
        .then((data) => setUser(data))
        .catch(() => {
            localStorage.removeItem("token");
            router.replace("/login");
        });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.replace("/login");
    };
    return (
        <div className="portal-shell">
            <ClientSidebar
            pathname={pathname}
            user={user}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onLogout={handleLogout}
            />

        <div className="portal-main">
            <ClientTopbar
            user={user}
            onMenu={() => setSidebarOpen((current) => !current)}
            />
            <main className="portal-content">
            {children}
            </main>
        </div>
        </div>
    );
}
