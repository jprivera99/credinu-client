# CHANGELOG

Todos los cambios importantes del sistema se documentan en este archivo.

Formato basado en **Keep a Changelog** y versionado semántico.

---
## [1.0] - 2026-04-09
### Agregado
- Creación de appError.js en donde se usara para lanzar errores controlados desde servicios. 
- Creación de types.js 

## [1.1.1] - 2026-04-13
### Modificado
- Cambio de color del icono del dashboard en ClientTopbar.tsx en la clase úser-avatar' en global.css, en ´background:linear-gradient´ 
- Cambio de colores del dashboard, junto con icono de credinu, estilos para las casillas de terminos y aviso de privacidad, en ClientTopBar.tsx y ClientSidebar.tsx
- Cambio de colores en register/page.tsx se agrego colores similares a los colores del logo de credinu, y se agregaron clases en global.css 
- Cambio de colores en login/page.tsx se agrego colores similares a los colores del logo de credinu, y se agregaron clases nuevas en gloabl.css
- Se modifico un nuevo menu despegable en el dashboard para las opciones del usuario. 

## [1.1] - 2026-04-13
### Agregado
- Creación de un nuevo modulo TreatmentDataModel.tsx para la autorización del tratamiento de los datos personales, esto se conecta con la parte en register/page.tsx con un modal ´setOpenTreatmentModal´.
- Creación de un nuevo modulo TermsModal.tsx para los terminos y condiciones, esto se conecta con la parte en register/page.tsx con un modal ´SetOpenTermsModal´ en register/page.tsx
- Creación de un nuevo modulo PrivacyModal.tsx para el aviso de privacidad, esto con el fin de estar correctos con el tratado de la información, esto se conecta con un modal ´SetOpenPrivacyModal´ en register/page.tsx

