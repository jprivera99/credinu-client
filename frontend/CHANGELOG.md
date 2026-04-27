# CHANGELOG

Todos los cambios importantes del sistema se documentan en este archivo.

Formato basado en **Keep a Changelog** y versionado semántico.

---

## [1.3.6] - 2026-04-24

### Agregado

- Flujo completo de registro:

  - Confirmación de datos
  - Selección de canal
  - Envío de código
  - Validación de código
  - Registro final

### Agregado

- Modales adicionales:

  - `SuccessRegisterModal`
  - `LoadingModal`
  - `FinalRegisterModal`

### Agregado

- Página `/change-password`:

  - Lectura de token desde URL
  - Validación de contraseña
  - Confirmación de contraseña

### Agregado

- Modal de éxito en cambio de contraseña con redirección automática.

### Corregido

- Error en uso de `Promise.all`.
- Error en envío de parámetros en `validateRegisterRequest`.
- Error de `setState` dentro de `useEffect`.
- Manejo correcto del token en cambio de contraseña.
- Corrección en visualización de modales.

---

## [1.3.5] - 2026-04-23

### Agregado

- Generación automática de:

  - RFC (preview)
  - CURP (preview)
- Integración de:

  - `sendCodeRequest`
  - `validateCodeRequest`

### Agregado

- Modales:

  - `ConfirmDataModal`
  - `SelectChannelModal`
  - `VerifyCodeModal`

---

## [1.3.4] - 2026-04-22

### Agregado

- Integración con backend:

  - `validateRegisterRequest`
- Validaciones en frontend:

  - Correo válido
  - Teléfono de 10 dígitos
  - Mayoría de edad
  - Campos obligatorios

### Mejorado

- Manejo de errores desde backend en frontend.

---

## [1.3.3] - 2026-04-21

### Agregado

- Creación de pantalla `/register`.
- Formulario inicial de registro.
- Campos:

  - Correo
  - Nombre
  - Apellidos
  - Fecha de nacimiento
  - Teléfono

---

## [1.3.2] - 2026-04-17

### Agregado
- Implementación completa del flujo de registro en `register/page.tsx`.
- Validaciones en formulario:
  - Nombre y apellidos requeridos
  - Edad mínima (18 años)
  - Teléfono de 10 dígitos
  - RFC (13 caracteres)
  - CURP obligatorio
  - Aceptación de términos, aviso de privacidad y tratamiento de datos

- Flujo de modales paso a paso:
  - Confirmación de RFC y CURP (`ConfirmDataModal`)
  - Selección de canal de verificación SMS / WhatsApp (`SelectChannelModal`)
  - Ingreso de código de verificación (`VerifyCodeModal`)
  - Modal de éxito de validación (`SuccessRegisterModal`)
  - Modal de carga durante registro (`LoadingModal`)
  - Modal final de registro exitoso (`FinalRegisterModal`)

- Lógica de control de estados para modales:
  - `showConfirmModal`
  - `showChannelModal`
  - `showVerifyModal`
  - `showSuccessModal`
  - `showLoadingModal`
  - `showFinalModal`

- Simulación de envío y validación de código SMS/WhatsApp.

### Mejorado
- Optimización del flujo UX:
  - Validaciones antes de enviar código SMS para evitar costos.
  - Separación entre validación de código y registro real.
- Flujo guiado tipo aplicación bancaria (step-by-step).
- Reutilización de estilos de modales (`privacy-modal`).
- Manejo centralizado del estado del formulario.

### Corregido
- Error donde los modales se renderizaban como contenido normal (problema de estilos/z-index).
- Inconsistencia entre clases (`modal-overlay` vs `privacy-modal`).
- Error en flujo donde el modal de verificación se cerraba incorrectamente.
- Problema al mostrar el modal de éxito después de validar código.
- Ajustes en eventos de botones (validar / reenviar código).

---

## [1.3.1] - 2026-04-15
### Agregado
- Se agrega input con el select de estado de nacimiento en register/pgae.tsx

---

## [1.3.0] - 2026-04-10

### Agregado
- Implementación de formulario de registro de clientes.
- Integración con endpoint `/auth/register`.
- Validación de aceptación de términos y condiciones.

### Cambiado
- Manejo de errores en peticiones API (uso de `apiFetch`).
- Estructura de payload enviada al backend.

### Corregido
- Error en consumo de API por URL incorrecta (puerto).
- Validación de envío de datos en login.
- Manejo de respuestas con estructura `{ success, message, data }`.

---

## [1.2.0] - 2026-04-09

### Agregado
- Creación de appError.js en donde se usara para lanzar errores controlados desde servicios. 
- Creación de types.js 

---

## [1.1.1] - 2026-04-13

### Modificado
- Cambio de color del icono del dashboard en ClientTopbar.tsx en la clase úser-avatar' en global.css, en ´background:linear-gradient´ 
- Cambio de colores del dashboard, junto con icono de credinu, estilos para las casillas de terminos y aviso de privacidad, en ClientTopBar.tsx y ClientSidebar.tsx
- Cambio de colores en register/page.tsx se agrego colores similares a los colores del logo de credinu, y se agregaron clases en global.css 
- Cambio de colores en login/page.tsx se agrego colores similares a los colores del logo de credinu, y se agregaron clases nuevas en gloabl.css
- Se modifico un nuevo menu despegable en el dashboard para las opciones del usuario. 

---

## [1.1.0] - 2026-04-13

### Agregado
- Creación de un nuevo modulo TreatmentDataModel.tsx para la autorización del tratamiento de los datos personales, esto se conecta con la parte en register/page.tsx con un modal ´setOpenTreatmentModal´.
- Creación de un nuevo modulo TermsModal.tsx para los terminos y condiciones, esto se conecta con la parte en register/page.tsx con un modal ´SetOpenTermsModal´ en register/page.tsx
- Creación de un nuevo modulo PrivacyModal.tsx para el aviso de privacidad, esto con el fin de estar correctos con el tratado de la información, esto se conecta con un modal ´SetOpenPrivacyModal´ en register/page.tsx

---

## [1.0.0] - 2026-04-09

### Agregado
- Creación de estructura base en Next.js.
- Configuración inicial de rutas (login, register).
- Implementación de servicios API (`loginRequest`, `registerRequest`, etc.).