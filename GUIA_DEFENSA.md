# Guía para la defensa

## Temas del curso y dónde se ven en el proyecto

| Tema | Archivo(s) donde se demuestra |
|---|---|
| HTML semántico | `frontend/src/paginas/*.jsx` (header, nav, main, section, footer; un `h1` por página) y `frontend/index.html` |
| Accesibilidad | `frontend/src/estilos/global.css` (foco visible, `prefers-reduced-motion`), `frontend/src/atomos/*.jsx` (`label`, `aria-*`), `frontend/ACCESIBILIDAD.md` |
| CSS y responsive | `frontend/src/estilos/global.css`: variables CSS, Flexbox, Grid, mobile-first |
| JavaScript moderno (ES6+) | `backend/src/**/*.js` y `frontend/src/**/*.jsx`: módulos, `async/await`, spread, desestructuración |
| DOM | `frontend/src/contexto/AutenticacionContexto.jsx` y componentes con `useRef` para foco / `document.title` |
| fetch | `frontend/src/servicios/api.js`: peticiones con token, FormData y errores uniformes |
| UI/UX | `frontend/src/organismos/*`, estados de carga/vacío/error, flashcards y quiz con retroalimentación |
| Git | Historial del repo, `.gitignore`, commits por tanda (ver `PLAN.md`) |
| Node.js | `backend/src/server.js`, `backend/package.json` (`type: module`, scripts) |
| Express | `backend/src/app.js`, `backend/src/rutas/*.js`, middlewares de token/rol/pertenencia |
| SQL | `backend/migraciones/001...006`, `backend/semillas/001_datos_ejemplo.sql`, consultas en `backend/src/servicios/*.js` |
| JWT y roles | `backend/src/middlewares/verificarToken.js`, `exigirRol.js`, `backend/src/servicios/autenticacion.servicio.js` |
| Seguridad | bcrypt, SHA-256, Zod, rate limit, CORS, webhook firmado, aislamiento multi-tenant |
| Deploy | `GUIA_DESPLIEGUE.md`, `.github/workflows/ci.yml`, variables de entorno de Render/Vercel/Neon |
| React | `frontend/src/paginas/*`, `frontend/src/organismos/*`, Atomic Design |
| Hooks | `useState`, `useEffect`, `useRef`, `useContext`, `useNavigate` en páginas y contexto |
| Router | `frontend/src/rutas/Rutas.jsx`, `RutaProtegida.jsx` |
| Testing | `backend/pruebas/*.prueba.js` (Jest + Supertest), `frontend/src/**/*.test.jsx` (RTL) |
| CI/CD | `.github/workflows/ci.yml` con PostgreSQL de servicio, npm cache, tests y build |

## Capturas sugeridas para la presentación

1. Portada con el botón «Crea tu curso gratis» y las 3 tarjetas de «Cómo funciona».
2. Panel del maestro con métricas y la lista de cursos con su código de invitación.
3. Editor de lección con el CSV cargado y el resumen `importadas / omitidas`.
4. Herramientas de ruso: alfabeto agrupado y teclado cirílico en pantalla.
5. Repaso: tarjeta volteada con ejemplo, transliteración y acento tónico.
6. Quiz con retroalimentación y XP ganado.
7. `/mi-plan` con uso frente a límites y botón a Stripe Checkout (modo prueba).
8. GitHub Actions en verde.

## Preguntas habituales

**¿Por qué 404 y no 403 si otro maestro intenta ver un curso ajeno?**  
Porque un 403 confirmaría que el recurso existe. El 404 no revela información y es la práctica habitual en multi-tenant.

**¿Por qué no XAMPP?**  
XAMPP trae MySQL. El proyecto usa PostgreSQL (Supabase/Neon) por sus tipos, extensiones y compatibilidad con el despliegue final.

**¿Qué pasa si el alumno no verifica el correo?**  
Se inscribe de inmediato con el código, pero no puede iniciar sesión hasta verificar. Así el código no se pierde si no abre el correo al momento.

**¿Cómo se calcula el XP?**  
10 XP por acierto (en el quiz y en el repaso cuando la tarjeta sube de caja), +20 si el quiz es perfecto y +10 extra al llegar a un múltiplo de 7 por primera vez ese día. Una tarjeta en la caja 5 ya no da XP, para evitar repetirla solo a sumar puntos. Si se reinicia el repaso de un curso, sus tarjetas vuelven a la caja 1 pero quedan marcadas `sin_xp`: se pueden estudiar otra vez sin inflar el XP.

**¿Cómo se decide la próxima revisión?**  
Leitner de 5 cajas: 1, 2, 4, 7 y 15 días. Acertar sube una caja; fallar vuelve a la 1. «Hoy» se calcula en `America/Mexico_City`.
