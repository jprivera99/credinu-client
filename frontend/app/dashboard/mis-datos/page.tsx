"use client";

import { useEffect, useState } from "react";
import { getClientProfile, updateClientProfile } from "@/lib/api";
import type { ClientProfile } from "@/lib/types";

export default function MisDatosPage() {
const [form, setForm] = useState<ClientProfile | null>(null);
const [message, setMessage] = useState("");

useEffect(() => {
getClientProfile().then((data) => setForm(data));
}, []);

if (!form) {
return <div className="empty-state">Cargando perfil...</div>;
}

const handleChange = <K extends keyof ClientProfile>(
field: K,
value: ClientProfile[K]
) => {
setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
};

const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
event.preventDefault();

await updateClientProfile({
email: form.email,
telefono_movil: form.telefono_movil,
domicilio_cp: form.domicilio_cp,
domicilio_calle: form.domicilio_calle,
domicilio_numero: form.domicilio_numero,
});

setMessage("Datos actualizados correctamente");
};

return (
<section className="portal-stack">
<div className="section-header">
<div>
<p className="hero-kicker">Perfil</p>
<h2>Mis Datos</h2>
</div>
</div>

<form className="form-card" onSubmit={handleSubmit}>
<div className="form-grid">
<label>
<span>Nombre</span>
<input value={form.nombre} disabled />
</label>

<label>
<span>Apellido paterno</span>
<input value={form.apellido_paterno} disabled />
</label>

<label>
<span>Apellido materno</span>
<input value={form.apellido_materno} disabled />
</label>

<label>
<span>RFC</span>
<input value={form.rfc} disabled />
</label>

<label>
<span>CURP</span>
<input value={form.curp} disabled />
</label>

<label>
<span>Correo</span>
<input
value={form.email ?? ""}
onChange={(e) => handleChange("email", e.target.value)}
/>
</label>

<label>
<span>Teléfono móvil</span>
<input
value={form.telefono_movil ?? ""}
onChange={(e) => handleChange("telefono_movil", e.target.value)}
/>
</label>

<label>
<span>Código postal</span>
<input
value={form.domicilio_cp ?? ""}
onChange={(e) => handleChange("domicilio_cp", e.target.value)}
/>
</label>

<label className="form-grid-span">
<span>Calle</span>
<input
value={form.domicilio_calle ?? ""}
onChange={(e) => handleChange("domicilio_calle", e.target.value)}
/>
</label>
</div>

<div className="form-actions">
{message ? <p className="success-copy">{message}</p> : null}
<button type="submit">Guardar cambios</button>
</div>
</form>
</section>
);
}