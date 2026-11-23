# PLAN DE EJECUCIÓN — SaaS para maestros de idiomas

Fuente: `INSTRUCCIONES_COMPLETAS.md`. Este archivo es el tablero de avance: se marca cada paso al terminarlo.

> Nota importante: el proyecto cambió de **entrenador de cirílico de un solo maestro** a **SaaS multi-maestro**. El código anterior (`/api/lecciones`, `/api/tarjetas`, campo `ruso`) se reemplaza. Necesitarás una **base de datos nueva o vacía**, porque las tablas y los nombres cambian (`palabra` en vez de `ruso`, cursos, inscripciones, etc.).

## Tanda 1 — Cimientos ✅ TERMINADA

- [x] Leer `INSTRUCCIONES_COMPLETAS.md` completo
- [x] Actualizar `CONTEXTO.md` al nuevo producto
- [x] Esquema SQL base (Prompt 1) — `backend/migraciones/001_crear_tablas.sql`
- [x] Migración de verificación (Prompt 1b) — `002_verificacion_correo.sql`
- [x] Migración de herramientas de ruso (Prompt 12b) — `003_herramientas_ruso.sql`
- [x] Migración de lecciones ligadas al libro (Prompt 12c) — `004_lecciones_libro.sql`
- [x] Datos de ejemplo: 2 maestros, 3 alumnos, cursos separados
- [x] `.env.example` con todas las variables nuevas

## Tanda 2 — Backend base y autenticación ✅ TERMINADA

- [x] Estructura `rutas / controladores / middlewares / config / utilidades`
- [x] `app.js` + `server.js` separados, `pg`, CORS configurable, `helmet`, límite de.body
- [x] `POST /auth/registro-maestro` + suscripción gratis
- [x] `POST /auth/registro-alumno` con código de invitación
- [x] `POST /auth/login` (JWT 7 días, error genérico) y `GET /auth/yo`
- [x] Middlewares `verificarToken`, `exigirRol`, manejo global de errores
- [x] Verificación de correo (Prompt 2b): Resend, tokens SHA-256, verificar/reenviar, rate limit
- [x] Login bloqueado con código `correo_no_verificado`
- [x] Restablecer contraseña (Prompt 2c, opcional)
- [x] Pruebas Jest de utilidades y smoke test de endpoints (4/4 pruebas pasan)

## Tanda 3 — Cursos y aislamiento ✅ TERMINADA

- [x] CRUD de cursos + regenerar código, alumnos, inscripciones, `/mis-cursos`
- [x] Middleware de pertenencia (404 si es de otro maestro, nunca 403)
- [x] Pruebas Jest + supertest de aislamiento entre maestros (16/16 pruebas pasan)

## Tanda 4 — Lecciones, tarjetas y CSV ✅ TERMINADA

- [x] CRUD de lecciones con `publicada` y filtro por inscripción
- [x] CRUD de tarjetas con campos de ruso
- [x] `POST /lecciones/:id/importar-csv`: UTF-8, BOM, acentos en cabecera, 500 filas / 1 MB, resumen
- [x] Pruebas de importación con cirílico, fila vacía y duplicado (22/22 pruebas pasan)

## Tanda 5 — Planes y límites ✅ TERMINADA

- [x] `config/planes.js` (gratis: 2 cursos / 10 alumnos; pro: ilimitado / 50)
- [x] `verificarLimite('curso')` y `verificarLimite('alumno')`
- [x] `GET /mi-plan`
- [x] Pruebas de límites (27/27 pruebas pasan)

## Tanda 6 — Repaso espaciado ✅ TERMINADA

- [x] Función pura de Leitner (5 cajas, 1/2/4/7/15 días, `America/Mexico_City`)
- [x] `GET /cursos/:cursoId/repaso/hoy` y `POST /repaso/respuesta` (UPSERT)
- [x] Pruebas de la función pura y del servicio (35/35 pruebas pasan)

## Tanda 7 — Quiz, XP y racha ✅ TERMINADA

- [x] Generador de preguntas (2 tipos, 4 opciones, aleatorio)
- [x] `POST /quiz/resultado` con XP y bonus
- [x] Función pura de racha + nivel
- [x] `GET /panel/alumno` y `GET /panel/maestro` (+ reporte de Prompt 12c)
- [x] Pruebas de quiz, racha y XP (42/42 pruebas pasan)

## Tanda 8 — Pagos (Stripe, modo prueba) ✅ TERMINADA

- [x] Checkout, portal, webhook con verificación de firma e idempotencia
- [x] Variables de entorno y guía de prueba con CLI de Stripe
- [x] Pruebas de idempotencia y límites en registro (47/47 pruebas pasan)

## Tanda 9 — Frontend ✅ TERMINADA

- [x] Vite 7 + Router 7 + contexto de auth + rutas protegidas + `api.js`
- [x] Atomic Design (átomos, moléculas, organismos, páginas)
- [x] Páginas públicas, panel maestro, pantallas alumno, verificación de correo
- [x] Herramientas de ruso (alfabeto, acento, teclado cirílico, frases)
- [x] Diseño responsive, accesibilidad y estados de carga/error
- [x] 14 pruebas RTL/Jest en verde y build de producción correcto

## Tanda 10 — Pruebas, CI/CD y cierre ✅ TERMINADA

- [x] Pruebas backend (52/52 pasan) y script `test:coverage`
- [x] Pruebas frontend (14/14 pasan) y script `test:coverage`
- [x] `npm audit` limpio en backend y frontend (Vite 7 / Router 7)
- [x] GitHub Actions con PostgreSQL de servicio y auditoría en ambos paquetes
- [x] Guía de despliegue (Vercel / Render / Supabase o Neon), Stripe y Resend
- [x] README.md, guía de pruebas manuales y guía de defensa
- [x] Revisión de secretos y aislamiento en consultas SQL
- [x] `CONTEXTO.md` final actualizado
- [ ] API externa de traducción (Prompt 16, **opcional**: no bloquea la entrega)

---

## Reglas que no cambian

- JavaScript ES6+, nombres en español, UTF-8, bcrypt, secretos en `.env`.
- **Toda consulta SQL filtra por dueño** (maestro o curso inscrito).
- 404 (no 403) cuando el recurso pertenece a otro maestro.
- Al terminar: cómo probar + commit sugerido.
