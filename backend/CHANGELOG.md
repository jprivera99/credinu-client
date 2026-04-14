# CHANGELOG

Todos los cambios importantes del sistema se documentan en este archivo.

Formato basado en **Keep a Changelog** y versionado semántico.

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