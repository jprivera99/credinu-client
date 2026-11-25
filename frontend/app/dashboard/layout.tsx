import { ClientShell } from "@/components/ClientShell";
import "./portal.css";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ClientShell>{children}</ClientShell>;
}
