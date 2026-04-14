"use client";

import { useEffect } from "react";

interface PrivacyModalProps {
  onClose: () => void;
}

export function PrivacyModal({ onClose }: PrivacyModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div
        className="privacy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="privacy-title" className="privacy-modal-title">
          Aviso de Privacidad
        </h3>

        <div className="privacy-modal-content">
          <p>
            De acuerdo con lo Previsto en la "Ley Federal de Protección de Datos Personales en posesión de los
            particulares", declara <strong>SUPPLY CREDIT DE MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R.</strong>, ser
            una empresa legalmente constituida de conformidad con las leyes, con domicilio en Sain Alto #302,
            Colonia Mitras Centro, C.P. 64460, Monterrey, Nuevo León; y como responsable del tratamiento de sus
            datos personales, hace de su conocimiento que la información de nuestros clientes es tratada de forma
            estrictamente confidencial.
          </p>

          <p>
            Para llevar a cabo las finalidades descritas en el presente Aviso, recabaremos para su tratamiento,
            los siguientes datos personales de los cuales usted es titular: (i) nombre completo, (ii) domicilio,
            (iii) correo electrónico, (iv) fecha y lugar de nacimiento, (v) nacionalidad, (vi) número de
            teléfono/móvil, (vii) Registro Federal de Contribuyentes, (viii) CURP, (ix) estado civil, (x) datos
            de identificación y contacto, (xi) geolocalización, (xii) datos académicos, (xiii) en su caso, datos
            migratorios, (xiv) de así autorizarlo el Titular, verificación de datos a través de redes sociales,
            (xv) datos patrimoniales, (xvi) ingresos y egresos a través de acceso a su cuenta del SAT y/o cuentas
            bancarias, (xvii) motivo del crédito solicitado, (xviii) tipo de negocio.
          </p>

          <p>
            El consentimiento expreso del Titular para el tratamiento de los Datos Personales será recabado a
            través de nuestro sitio web <strong>www.supplycredit.com.mx</strong> o por cualquier otro medio
            electrónico, telefónico, y en su caso, a través del área de promoción y administración.
          </p>

          <p>
            Asimismo, SUPPLY CREDIT DE MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R., podrá recabar estos datos de
            manera indirecta en caso de que nos sean proporcionados por empresas pertenecientes al grupo,
            Sociedades de Información Crediticia, u otros terceros con los que se tengan celebrados acuerdos
            comerciales.
          </p>

          <p>
            SUPPLY CREDIT DE MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R. hace del conocimiento del Titular que
            respecto de los datos de otras personas que el Titular proporcione (obligados solidarios, garantes,
            avales, proveedores, beneficiarios), el Titular se obliga a informarles sobre el tratamiento de sus
            datos y el contenido de este Aviso.
          </p>

          <p><strong>Finalidades de tratamiento:</strong></p>
          <ul>
            <li>Cumplimiento de la relación contractual derivada de la solicitud y/o contratación de los Servicios.</li>
            <li>Verificar, confirmar y validar la identidad del Titular y la información que proporciona.</li>
            <li>Administrar, operar y dar seguimiento a los Servicios solicitados o contratados.</li>
            <li>Realizar análisis de la información para determinar nivel de riesgo, viabilidad de pago y perfil transaccional.</li>
            <li>Formalizar la relación contractual con el Titular.</li>
            <li>Incluirlo en nuestra base de datos e integrar expedientes, directamente o a través de un tercero.</li>
            <li>Procesar las solicitudes realizadas por medios electrónicos.</li>
            <li>Consultar y realizar investigaciones crediticias ante sociedades de información crediticia.</li>
            <li>Ofrecer ampliación o mejora de los Servicios contratados e informar sobre actualizaciones.</li>
            <li>Llevar a cabo inteligencia comercial, investigaciones de mercado y mejora de nuestros medios electrónicos.</li>
            <li>Enviar comunicaciones relacionadas con los Servicios contratados.</li>
          </ul>

          <p><strong>Finalidades secundarias o accesorias:</strong></p>
          <ul>
            <li>Envío de ofertas, promociones, mercadotecnia o eventos especiales de interés del Titular.</li>
            <li>Envío de artículos sobre educación financiera.</li>
            <li>Envío de boletín de noticias, ofertas, beneficios y servicios de socios comerciales.</li>
            <li>Comercialización de productos y servicios de SUPPLY CREDIT DE MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R. y empresas del grupo.</li>
          </ul>
          <p>
            El Titular podrá negarse al tratamiento de sus Datos Personales para las finalidades secundarias
            enviando un correo a <strong>une@supplycredit.com.mx</strong>. En caso de no recibir la solicitud
            correspondiente, se entenderá consentido el uso de su información para todas las finalidades mencionadas.
          </p>

          <p><strong>Transferencia de Datos Personales.</strong></p>
          <p>
            SUPPLY CREDIT DE MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R. compartirá sus Datos Personales, sin
            requerir su consentimiento, con: (i) sociedades controladoras, subsidiarias o afiliadas bajo control
            común, así como la sociedad matriz o cualquier sociedad del grupo corporativo; (ii) autoridades
            competentes, según la legislación aplicable; (iii) sociedades encargadas de investigaciones de fraude
            y recolección de pagos; (iv) otras empresas en caso de adquisición, fusión u operación similar;
            (v) terceros, incluidas entidades financieras, para cesión o descuento de cartera; (vi) socios
            comerciales con contratos para la comercialización de productos o servicios en beneficio del Titular;
            y (vii) en cualquier otro supuesto del artículo 10 y 37 de la LFPDPPP.
          </p>

          <p><strong>Ejercicio de derechos ARCO y revocación del consentimiento.</strong></p>
          <p>
            El Titular tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos
            personales. Dicha solicitud deberá presentarse por escrito en el domicilio de SUPPLY CREDIT DE
            MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R., dirigida a la atención de <strong>Javier Juárez Carballo</strong>,
            o mediante correo electrónico a <strong>une@supplycredit.com.mx</strong>, acompañando:
          </p>
          <ul>
            <li>Nombre, domicilio u otro medio para recibir respuesta, y documentos que acrediten identidad o representación legal.</li>
            <li>Cualquier elemento o documento que facilite la localización de los Datos Personales.</li>
            <li>Descripción clara y precisa de los Datos Personales y el derecho que desea ejercer.</li>
            <li>La solicitud deberá ir firmada al final y rubricada en cada hoja.</li>
          </ul>
          <p>
            SUPPLY CREDIT DE MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R. responderá en un plazo no mayor a
            20 días hábiles a partir de la recepción. Si resulta procedente, se hará efectiva dentro de los
            15 días hábiles siguientes. En caso de información errónea o insuficiente se requerirá subsanación
            en un plazo de 5 días hábiles; el Titular contará con 10 días hábiles para atender dicho requerimiento.
          </p>
          <p>
            SUPPLY CREDIT DE MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R. podrá negar el ejercicio de Derechos ARCO
            en los supuestos que lo permita la LFPDPPP y su reglamento.
          </p>
          <p>
            El Titular podrá revocar su consentimiento para el tratamiento de sus Datos Personales, sin efectos
            retroactivos, siempre que no suponga la imposibilidad de cumplir obligaciones derivadas de una
            relación jurídica vigente. El procedimiento es el mismo que el establecido para el ejercicio de
            los derechos ARCO.
          </p>

          <p><strong>Medios para Limitar el Uso o Divulgación de sus Datos Personales.</strong></p>
          <p>
            En términos del artículo 22 de la LFPDPPP, el Titular podrá limitar el uso o divulgación de sus
            datos conforme al procedimiento previsto en la sección "Ejercicio de Derechos ARCO y revocación
            del consentimiento".
          </p>

          <p><strong>Uso de Cookies y Tecnologías Similares.</strong></p>
          <p>
            SUPPLY CREDIT DE MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R. utiliza mecanismos remotos o locales de
            comunicación electrónica que permiten recabar Datos Personales relacionados con su actividad en los
            medios electrónicos. Las cookies son fragmentos de información que ayudan a reconocer su usuario en
            visitas posteriores. Usted puede borrar, bloquear o recibir advertencias sobre cookies en los
            navegadores más comunes. Los medios electrónicos pueden incluir enlaces a sitios de terceros respecto
            de los cuales SUPPLY CREDIT DE MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R. no asume responsabilidad alguna.
          </p>

          <p><strong>Consentimiento.</strong></p>
          <p>
            Al utilizar nuestros medios electrónicos y/o contratar los Servicios, expresamente reconoce y acepta
            el presente Aviso. Si tiene alguna duda, envíe un correo a <strong>une@supplycredit.com.mx</strong>.
          </p>

          <p><strong>Cambios al Aviso de Privacidad.</strong></p>
          <p>
            SUPPLY CREDIT DE MÉXICO S.A.P.I. DE C.V., SOFOM, E.N.R. podrá hacer modificaciones al presente
            Aviso, las cuales se publicarán en <strong>www.supplycredit.com.mx</strong>.
          </p>

          <p>
            <em>
              Acepto de conformidad el contenido del Aviso de Privacidad que me da SUPPLY CREDIT DE MÉXICO
              S.A.P.I. DE C.V., SOFOM, E.N.R.
            </em>
          </p>
        </div>

        <button
          type="button"
          className="privacy-modal-close"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
