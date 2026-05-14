"use client";

import { useEffect, useState } from "react";
import { getClientProfile, updateClientProfile } from "@/lib/api";
import type { ClientProfile } from "@/lib/types";

export default function MisDatosPage() {
	const [form, setForm] = useState<ClientProfile | null>(null);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		getClientProfile()
			.then((data) => setForm(data))
			.catch((fetchError) => {
				const fetchMessage =
					fetchError instanceof Error
						? fetchError.message
						: "No fue posible cargar tu perfil";
				setError(fetchMessage);
			});
	}, []);

	useEffect(() => {
		if (!message && !error) return;

		const timeoutId = window.setTimeout(() => {
			setMessage("");
			setError("");
		}, 10000);

		return () => window.clearTimeout(timeoutId);
	}, [message, error]);

	if (!form) {
		return <div className="empty-state">{error || "Cargando perfil..."}</div>;
	}

	const handleChange = <K extends keyof ClientProfile>(
		field: K,
		value: ClientProfile[K]
	) => {
		setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setMessage("");
		setSaving(true);

		try {
			await updateClientProfile({
				correo: form.correo,
				telefono_movil: form.telefono_movil,
				domicilio_cp: form.domicilio_cp,
				domicilio_calle: form.domicilio_calle,
				domicilio_numero: form.domicilio_numero,
			});

			setMessage("Datos actualizados correctamente");
		} catch (saveError) {
			const saveMessage =
				saveError instanceof Error
					? saveError.message
					: "No fue posible actualizar tus datos";
			setError(saveMessage);
		} finally {
			setSaving(false);
		}
	};

	return (
		<section className="portal-stack">
			<div className="section-header">
				<div>
					<p className="hero-kicker">Perfil</p>
					<h2>Mis Datos</h2>
				</div>
			</div>

			<p className="form-notice is-warning onboarding-warning" role="note">
				Si tus datos son incorrectos Comunícate con tu Ejecutivo Onboarding
			</p>

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
							value={form.correo ?? ""}
							onChange={(e) => handleChange("correo", e.target.value)}
						/>
					</label>

					<label>
						<span>Telefono movil</span>
						<input
							value={form.telefono_movil ?? ""}
							onChange={(e) => handleChange("telefono_movil", e.target.value)}
						/>
					</label>

					<label>
						<span>Codigo postal</span>
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

					<label>
						<span>No. exterior</span>
						<input
							value={form.domicilio_numero ?? ""}
							onChange={(e) => handleChange("domicilio_numero", e.target.value)}
						/>
					</label>
				</div>

				{message ? (
					<p className="form-notice is-success" role="status" aria-live="polite">
						{message}
					</p>
				) : null}

				{error ? (
					<p className="form-notice is-error" role="alert">
						{error}
					</p>
				) : null}

				<div className="form-actions">
					<button type="submit" disabled={saving}>
						{saving ? "Guardando..." : "Guardar cambios"}
					</button>
				</div>
			</form>
		</section>
	);
}