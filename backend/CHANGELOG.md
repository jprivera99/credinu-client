# CHANGELOG

Todos los cambios importantes del sistema se documentan en este archivo.

Formato basado en **Keep a Changelog** y versionado semántico.

---

## [1.3.0] - 2026-04-17

### Agregado
- Creación del módulo `register` en backend con estructura:
  - `register.controller.js`
  - `register.routes.js`
  - `register.service.js`
- Endpoint de pre-registro de usuarios.
- Validaciones de correo y teléfono antes del registro.
- Generación de password temporal y token de activación.
- Endpoints adicionales:
  - `validate-email`
  - `validate-phone`
  - `validate-sms` (mock)
- Integración inicial con REM (mock).
- Simulación de envío de correo con credenciales.

- Implementación completa del flujo de registro en frontend:
  - Formulario de registro con validaciones.
  - Modal de confirmación de RFC y CURP.
  - Modal de selección de canal (SMS / WhatsApp).
  - Modal de ingreso de código de verificación.
  - Modal de éxito de validación.
  - Modal de carga (procesando registro).
  - Modal final de registro exitoso.

- Creación de componentes:
  - `ConfirmDataModal`
  - `SelectChannelModal`
  - `VerifyCodeModal`
  - `SuccessRegisterModal`
  - `LoadingModal`
  - `FinalRegisterModal`

### Mejorado
- Optimización del flujo de registro:
  - Validaciones antes de envío de SMS para evitar costos innecesarios.
- Uso de trigger existente en base de datos para inserción automática en:
  - `sis_usuario`
  - `cliente`
- Unificación de estilos de modales (`privacy-modal`).
- Flujo UX tipo aplicación bancaria (paso a paso).

### Corregido
- Error en `INSERT` por desajuste de columnas.
- Error `Cannot read properties of undefined (reading 'id')`.
- Problemas de rutas en backend (`/api/register`).
- Error de modales renderizados como contenido normal (z-index / estilos).
- Corrección en flujo de validación de código (cierre incorrecto de modal).
- Ajustes en entorno de pruebas relacionados con triggers.

---

## [1.2.0] - 2026-04-10

### Agregado
- Implementación de autenticación con JWT.
- Endpoint `/auth/login` funcional.
- Endpoint `/auth/register` para registro de usuarios.
- Validación de perfil de cliente para acceso al portal.

### Cambiado
- Migración de validación de contraseñas a `bcrypt`.
- Mejora en la generación de tokens (expiración e issuer).
- Inclusión de `trim()` en validación de contraseñas.

### Corregido
- Error en detección de hash bcrypt (regex incorrecto).
- Fallo en autenticación por uso incorrecto de MD5.
- Error de credenciales inválidas por inconsistencia en hash.
- Validación de datos incompletos en registro.

### Seguridad
- Eliminación de uso directo de MD5 como método principal.
- Implementación de migración automática de contraseñas legacy a bcrypt.
- Mejora en manejo de errores mediante `AppError`.

---
## [1.1.0] - 2026-04-09

### Agregado
- Creación de appError.js en donde se usara para lanzar errores controlados desde servicios. 
- Creación de responses.js que se utilizara para estandarizar respuestas.
- Creación de jwt.js que se centraliza en la firma del token.
- Creación de validateRequest.js que evitará repetir validationResult en todos lados. 
- Creación de errorHandler.js para manejar excepciones de servicios/controladores
- Creación de auth.validators.js para mejora de validaciones
 
---

## [1.0.0] - 2026-04-09

### Agregado
- Configuración inicial del servidor.
- Conexión a base de datos MySQL.
- Estructura base de servicios (`auth`, `user`).
- Implementación inicial de login.