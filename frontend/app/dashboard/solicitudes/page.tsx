"use client";

import { useEffect, useState } from "react";
import { getClientApplications } from "@/lib/api";
import type { ApplicationItem } from "@/lib/types";

export default function SolicitudesPage() {
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getClientApplications()
            .then((data) => setApplications(data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="portal-stack">
            <div className="section-header">
                <div>
                    <p className="hero-kicker">Seguimiento</p>
                    <h2>Solicitudes de crédito</h2>
                </div>
            </div>

            {loading ? (
                <div className="empty-state">Cargando solicitudes...</div>
            ) : applications.length === 0 ? (
                <div className="empty-state">Aún no tienes solicitudes.</div>
            ) : (
                <div className="table-card">
                    <table className="portal-table">
                        <thead>
                            <tr>
                                <th>Folio</th>
                                <th>Producto</th>
                                <th>Estatus</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map((item) => (
                                <tr key={item.id}>
                                    <td>#{item.id}</td>
                                    <td>{item.producto ?? "Sin nombre"}</td>
                                    <td>{item.estatus ?? "Sin estatus"}</td>
                                    <td>{item.fecha_registro ?? "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}