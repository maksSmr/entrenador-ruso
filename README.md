# SaaS para maestros de idiomas

Plataforma web en **español** para que cualquier maestro de idiomas cree cursos, suba lecciones y tarjetas, invite a sus alumnos y les ofrezca flashcards, quizzes, audio y repaso espaciado con XP y racha diaria. Empieza centrada en **ruso para hispanohablantes** e incluye herramientas del cirílico, pero el campo principal se llama `palabra`, así que sirve para cualquier idioma.

> Fuente completa de requisitos: `INSTRUCCIONES_COMPLETAS.md`. Avance detallado: `PLAN.md`. Contexto vivo: `CONTEXTO.md`.

## Stack

| Capa | Tecnología |
|---|---|
| API | Node.js 20 + Express 4 (ESM) |
| Base de datos | PostgreSQL (Supabase / Neon / local) |
| Autenticación | JWT de 7 días con roles `maestro` y `alumno` |
| Validación | Zod + errores JSON uniformes |
| Correo | Resend (con enlace impreso en consola si no hay clave) |
| Pagos | Stripe en modo prueba |
| Frontend | React + Vite + React Router + Atomic Design |
| Pruebas | Jest + Supertest + React Testing Library |
| CI/CD | GitHub Actions con PostgreSQL de servicio |

## Estructura

```text
backend/
  migraciones/   001..006 (esquema, verificación, ruso, libro, webhooks, respuestas)
  semillas/      datos de ejemplo (2 maestros aislados)
  src/
    config/      entorno, baseDatos, planes
    middlewares/ token, rol, pertenencia, límites, validación, errores, CSV
    rutas/       auth, cursos, inscripciones, lecciones, tarjetas, repaso, quiz, panel, suscripción, webhook
    controladores/ capa delgada
    servicios/   lógica de negocio y SQL
    utilidades/  esquemas, tokens, correo, Leitner, racha, quiz, CSV, cirilico...
    app.js       app sin escuchar (para pruebas)
    server.js    arranque del puerto
  pruebas/       Jest + Supertest
frontend/
  src/atomos, moleculas, organismos, paginas, contexto, hooks, rutas, servicios, utilidades, estilos
```

## Arrancar en local

### 1. Base de datos

No uses XAMPP: trae MySQL y este proyecto usa PostgreSQL. Elige una opción:

- **Neon o Supabase (recomendado, gratis)**: crea el proyecto y copia el *connection string*.
- **PostgreSQL local**: `createdb entrenador_ruso`.

Aplica los archivos **en orden**:

```bash
psql "$DATABASE_URL" -f backend/migraciones/001_crear_tablas.sql
psql "$DATABASE_URL" -f backend/migraciones/002_verificacion_correo.sql
psql "$DATABASE_URL" -f backend/migraciones/003_herramientas_ruso.sql
psql "$DATABASE_URL" -f backend/migraciones/004_lecciones_libro.sql
psql "$DATABASE_URL" -f backend/migraciones/005_webhook_idempotencia.sql
psql "$DATABASE_URL" -f backend/migraciones/006_respuestas_repaso.sql
psql "$DATABASE_URL" -f backend/semillas/001_datos_ejemplo.sql
```

### 2. Variables de entorno

```bash
cp backend/.env.example backend/.env
# Rellena DATABASE_URL y JWT_SECRET. DB_SSL=true en Neon/Supabase, false en local.
cp frontend/.env.example frontend/.env
```

### 3. API y frontend

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

API: `http://localhost:3000/salud` · Frontend: `http://localhost:5173`.

### Usuarios de ejemplo

Contraseña para todos: `123456`.

| Correo | Rol | Plan / curso |
|---|---|---|
| `ana@ejemplo.es` | maestro | gratis, «Ruso para principiantes» (`RUSO123`) |
| `boris@ejemplo.es` | maestro | pro, «Inglés de viaje» (`VIAJE99`) |
| `lucia@ejemplo.es` | alumno | curso de Ana, XP 120, racha 3 |
| `diego@ejemplo.es` | alumno | curso de Ana |
| `marta@ejemplo.es` | alumno | curso de Borís |

Todos están marcados como verificados para poder entrar sin Resend.

## Reglas importantes

1. **Multi-tenant**: toda consulta filtra por `maestro_id` o por curso inscrito.
2. Si un recurso pertenece a otro maestro se devuelve **404**, nunca 403. El 403 es solo para rol incorrecto.
3. Nombres en español en tablas, columnas, rutas y variables de dominio; UTF-8 para cirílico.
4. Contraseñas con bcrypt; tokens de verificación guardados solo como SHA-256.
5. Secretos únicamente en variables de entorno; `.env` está ignorado por Git.
6. Zona horaria `America/Mexico_City` para «hoy» en Leitner y rachas.

## Resumen de API

| Método | Ruta | Quién |
|---|---|---|
| POST | `/auth/registro-maestro`, `/auth/registro-alumno`, `/auth/login` | público |
| POST | `/auth/verificar-correo`, `/auth/reenviar-verificacion`, `/auth/olvide-contrasena`, `/auth/restablecer-contrasena` | público |
| GET | `/auth/yo`, `/mi-plan` | autenticado |
| GET/POST | `/cursos` | maestro |
| GET/PUT/DELETE | `/cursos/:id` | maestro dueño |
| POST | `/cursos/:id/regenerar-codigo` | maestro dueño |
| GET | `/cursos/:id/alumnos` | maestro dueño |
| POST | `/inscripciones`, GET `/mis-cursos` | alumno |
| GET/POST | `/cursos/:cursoId/lecciones` | dueño o inscrito |
| PUT/DELETE | `/lecciones/:id` | maestro dueño |
| GET/POST | `/lecciones/:id/tarjetas` | dueño o inscrito |
| POST | `/lecciones/:id/importar-csv` | maestro dueño |
| GET | `/lecciones/:id/quiz` | dueño o inscrito |
| POST | `/quiz/resultado` | alumno |
| GET | `/cursos/:cursoId/repaso/hoy`, POST `/repaso/respuesta` | alumno |
| GET | `/panel/alumno`, `/panel/maestro`, `/panel/maestro/reporte`, `/panel/maestro/reporte-detallado` | según rol |
| POST | `/suscripcion/checkout`, `/suscripcion/portal` | maestro |
| POST | `/stripe/webhook` | Stripe (firma verificada) |

## Pruebas

```bash
cd backend && npm test && npm audit
cd frontend && npm test && npm run build && npm audit
```

Resultado verificado: **52 pruebas backend** (13 suites) y **14 pruebas frontend** (5 suites) en verde; `npm audit` sin vulnerabilidades en ambos paquetes.

La CI (`/.github/workflows/ci.yml`) hace lo mismo y además aplica las migraciones a un PostgreSQL real.

## Despliegue y pruebas manuales

Consulta `GUIA_DESPLIEGUE.md`, `GUIA_PRUEBAS_MANUALES.md` y `GUIA_DEFENSA.md` (mapa de temas para la presentación). No subas claves reales: usa los secretos del proveedor de CI/CD.

## Commits sugeridos

```bash
git add . && git commit -m "feat: SaaS multi-maestro completo con frontend, pagos y CI"
```
