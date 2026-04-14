"use client";

import { useEffect, useMemo, useState } from "react";

interface TreatmentDataModalProps {
  onClose: () => void;
  onAccept: () => void;
}

export function TreatmentDataModal({ onClose, onAccept }: TreatmentDataModalProps) {
  const [consents, setConsents] = useState({
    general: false,
    sensitive: false,
    transfer: false,
    bureau: false,
  });

  const allAccepted = useMemo(
    () => Object.values(consents).every(Boolean),
    [consents]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggleConsent = (key: keyof typeof consents) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAcceptAll = () => {
    const nextValue = !allAccepted;
    setConsents({
      general: nextValue,
      sensitive: nextValue,
      transfer: nextValue,
      bureau: nextValue,
    });
    if (nextValue) {
      onAccept();
    }
  };

  return (
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div
        className="treatment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="treatment-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="treatment-modal-x"
          aria-label="Cerrar modal"
          onClick={onClose}
        >
          x
        </button>

        <h3 id="treatment-title" className="treatment-modal-title">
          Autorizacion para el Tratamiento de Datos Personales
        </h3>

        <div className="treatment-modal-content">
          <label className="treatment-consent-row">
            <input
              type="checkbox"
              checked={consents.general}
              onChange={() => toggleConsent("general")}
            />
            <span>
              Autorizo a Supply Credit de Mexico, S.A.P.I. de C.V. SOFOM ENR. el tratamiento de mis datos personales de acuerdo con la{" "}
              <span className="register-link">Politica de Tratamiento de Datos Personales</span> la cual he leido previamente de manera detenida
            </span>
          </label>

          <label className="treatment-consent-row">
            <input
              type="checkbox"
              checked={consents.sensitive}
              onChange={() => toggleConsent("sensitive")}
            />
            <span>
              Autorizo de manera voluntaria, previa y expresa a Supply Credit de México, S.A.P.I. de C.V. SOFOM ENR. para la recolección y tratamiento de mis datos sensibles, entre ellos, fotos de mi rostro, foto de mi documento de identidad y geolocalización con la finalidad de verificar mi identidad. Entiendo que dicho tratamiento se hará de conformidad con la <span className="register-link">Politica de Tratamiento de Datos Personales</span>. Asi mismo, declaro que conozco el derecho que ostento a entregar o no los datos sensibles solicitados.
            </span>
          </label>

          <label className="treatment-consent-row">
            <input
              type="checkbox"
              checked={consents.transfer}
              onChange={() => toggleConsent("transfer")}
            />
            <span>
              Autorizo de manera voluntaria, previa y expresa a Supply Credit de México, S.A.P.I. de C.V. SOFOM ENR. para dar a conocer, transferir y/o transmitir mis datos personales dentro y fuera del pais, a terceros a consecuencia de un contrato, ley o vinculo licito que asi lo requiera o para implementar servicios de computación en la nube.
            </span>
          </label>

          <label className="treatment-consent-row">
            <input
              type="checkbox"
              checked={consents.bureau}
              onChange={() => toggleConsent("bureau")}
            />
            <span>
              Autorizo a Supply Credit de México, S.A.P.I. de C.V. SOFOM ENR. para que consulte y reporte ante centrales de información financiera y crediticia que operan en México conforme a las <span className="register-link">Politica de Tratamiento de Datos Personales</span>.
            </span>
          </label>

          <label className="treatment-accept-all">
            <input
              type="checkbox"
              checked={allAccepted}
              onChange={handleAcceptAll}
            />
            <span>ACEPTAR TODAS</span>
          </label>
        </div>

        <button
          type="button"
          className="treatment-modal-close"
          onClick={() => {
            if (allAccepted) {
              onAccept();
            }
            onClose();
          }}
        >
          CERRAR
        </button>
      </div>
    </div>
  );
}