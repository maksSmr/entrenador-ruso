# Traspaso para llevar el proyecto a hosting

> Este archivo existe para pegarlo en un chat nuevo y continuar ahí sin perder contexto.

---

## 1. Contexto actual

**Proyecto:** SaaS en español para maestros de idiomas. `entrenador-ruso`.

- **Ubicación local:** `C:\Users\popus\Downloads\entrenador-ruso`
- **Backend:** Node + Express + PostgreSQL (Neon), JWT con roles `maestro` / `alumno`.
- **Frontend:** React 18 + Vite 7 + React Router 7.
- **Estado:** funciona en local contra Neon. API en `http://localhost:3000/salud` → `{"estado":"ok"}`; frontend en `http://localhost:5173`.
- **Base de datos:** BD Neon `neondb` ya creada; migraciones `001` a `007` y semilla aplicadas (la `007` añade hash/expiración de verificación en `usuarios` y `nota_gramatical` en `tarjetas`). 5 usuarios de ejemplo, contraseña `123456`, ya verificados: `ana@ejemplo.es` (maestra, curso `RUSO123`), `boris@ejemplo.es` (maestro, curso `VIAJE99`), `lucia@ejemplo.es`, `diego@ejemplo.es`, `marta@ejemplo.es`.
- **Pruebas:** backend 60/60, frontend 16/16, `npm audit` limpio, build de Vite correcto.
- **Funcionalidades nuevas:** verificación real con Resend + fallback, generación de tarjetas desde PDF/DOCX con Gemini (revisión del maestro antes de guardar) y preparación de CORS/PORT/VITE_API_URL para hosting.
- **Commit actual:** `feat: verificacion real, tarjetas con Gemini y preparacion para deploy` (consulta `git log -1`); el árbol de trabajo está limpio.
- **Git:** **no hay remoto** (`git remote -v` vacío). No hay push. Hay archivos nuevos sin seguimiento: `ARQUITECTURA_Y_MEJORAS.md`, `GUIA_USUARIO.md`, `RUBRICA_EVALUACION.md`, `HANDOFF_HOSTING.md`, `DESPLIEGUE.md` y `backend/migraciones/007_verificacion_y_gemini.sql`.
- **Deploy:** todavía no hay nada publicado. Hay guía práctica en `DESPLIEGUE.md`.
- **Objetivo de esta tanda:** publicar backend y frontend en planes gratuitos, dejar URLs reales funcionando y que el CI de GitHub se vea en verde. Esto suma ~4 puntos en la rúbrica (Deploy, GitHub, CI/CD y APIs externas) y deja el proyecto en ~92/100.

## 2. Decisiones que ya están tomadas (no cambiar)

- PostgreSQL **Neon**, no XAMPP (XAMPP es MySQL y este proyecto exige Postgres). `DB_SSL=true` en producción.
- Secretos **solo** en `backend/.env` o en los secretos del proveedor. `.env` está en `.gitignore`. Nunca subir claves.
- Multi-tenant estricto: recurso ajeno devuelve **404**, nunca 403; 403 solo para rol incorrecto.
- Resend y Stripe se dejaron **vacíos a propósito** en local: sin `RESEND_API_KEY` el correo se simula en consola. En producción se pueden configurar.
- Stripe va en **modo prueba** (`sk_test_...`). El webhook necesita body crudo: por eso está montado antes de `express.json()`.
- Vite 7 exige **Node 20.19+ o 22+**. El CI ya usa Node 22; Vercel debe configurarse con esa versión.
- El desajuste de contrato en `/panel/alumno` (backend devuelve números, frontend tiene un `Array.isArray` defensivo) fue revisado y **el usuario decidió conservarlo**. No tocar ese archivo en esta tanda salvo que él lo pida.

## 3. Archivos de configuración exactos

### `backend/.env.example` (plantilla)

```env
DATABASE_URL=postgresql://usuario:contrasena@host:5432/entrenador_ruso
DB_SSL=true
JWT_SECRET=cambia-esta-clave-por-una-larga-y-aleatoria
JWT_EXPIRA=7d
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
RESEND_API_KEY=
CORREO_REMITENTE=Entrenador de Idiomas <onboarding@resend.dev>
GEMINI_API_KEY=
GEMINI_MODELO=gemini-2.5-flash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRECIO_PRO=
```

Variables **obligatorias** en `backend/src/config/entorno.js`: `DATABASE_URL` y `JWT_SECRET`. Si falta alguna, la API arranca con `Faltan variables de entorno: ...`.

### `frontend/.env.example`

```env
VITE_API_URL=http://localhost:3000
```

En producción: `VITE_API_URL=https://TU-API.onrender.com`. Se inyecta en `vite.config.js` mediante `define`, así que se lee **al compilar** en Vercel.

### Scripts

- Backend: `npm install`, `npm start` (producción), `npm run dev`, `npm test`.
- Frontend: `npm install`, `npm run build` (salida `dist`), `npm run dev`, `npm test`.

### CORS

`backend/src/app.js` usa `cors({ origin: entorno.origenesPermitidos, credentials: true })`. En desarrollo se permiten `FRONTEND_URL` más los puertos locales de Vite (5173/4173); en `NODE_ENV=production` solo se permite `FRONTEND_URL`. **Esa URL debe ser exactamente la del frontend desplegado** (sin barra final), si no habrá errores de CORS. Después de desplegar el frontend hay que actualizar `FRONTEND_URL` en Render y reiniciar.

## 4. Pasos a ejecutar, en orden

### Paso 0 — Commitear documentos y crear remoto

```powershell
git remote add origin https://github.com/TU_USUARIO/entrenador-ruso.git
git branch -M main
git add ARQUITECTURA_Y_MEJORAS.md GUIA_USUARIO.md RUBRICA_EVALUACION.md HANDOFF_HOSTING.md DESPLIEGUE.md
git commit -m "docs: arquitectura, guia de usuario, rubrica y despliegue"
git push -u origin main
```

Si el repo ya existe en GitHub, omite la creación y usa su URL. Si `git remote add` dice que ya existe, usa `git remote set-url origin ...`.

### Paso 1 — Base de datos

La BD Neon ya está lista con datos y con la migración `007` aplicada. No hay que crear otra. Si se crea una nueva, ejecutar en el SQL Editor **en orden** los archivos `backend/migraciones/001` a `007` y después `backend/semillas/001_datos_ejemplo.sql`. Copiar el connection string **pooled** como `DATABASE_URL`.

### Paso 2 — Backend en Render

1. *New → Web Service* → conectar el repo de GitHub.
2. Runtime: **Node**. Root directory: `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Variables de entorno:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | connection string pooled de Neon |
| `DB_SSL` | `true` |
| `JWT_SECRET` | clave larga y aleatoria nueva (distinta de la local) |
| `JWT_EXPIRA` | `7d` |
| `PORT` | `3000` (o dejar que Render lo asigne) |
| `FRONTEND_URL` | URL de Vercel (se completa en el paso 3) |
| `NODE_ENV` | `production` (así Resend envía correos reales y CORS queda cerrado) |
| `RESEND_API_KEY` | vacío al inicio; luego clave de Resend |
| `CORREO_REMITENTE` | `Entrenador de Idiomas <onboarding@resend.dev>` |
| `GEMINI_API_KEY` | vacío al inicio; luego clave de Google AI Studio |
| `GEMINI_MODELO` | `gemini-2.5-flash` |
| `STRIPE_SECRET_KEY` | vacío al inicio; luego `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | vacío al inicio; luego `whsec_...` |
| `STRIPE_PRECIO_PRO` | vacío al inicio; luego `price_...` |

5. Desplegar y comprobar `https://TU-API.onrender.com/salud` → `{"estado":"ok"}`.

### Paso 3 — Frontend en Vercel

1. *Add New → Project* → conectar el mismo repo.
2. Root directory: `frontend`. Framework: **Vite**. Node version: **22**.
3. Build command: `npm run build`. Output directory: `dist`.
4. Variable de entorno: `VITE_API_URL=https://TU-API.onrender.com`.
5. Desplegar y comprobar que `/login` y `/herramientas/ruso` cargan sin pantalla en blanco.
6. Volver a Render, poner `FRONTEND_URL=https://TU-FRONTEND.vercel.app` y reiniciar el servicio.

### Paso 4 — Stripe (opcional pero suma puntos)

1. Stripe → catálogo → producto **Pro**, precio mensual recurrente. Copiar `price_...` a `STRIPE_PRECIO_PRO`.
2. Clave secreta de prueba `sk_test_...` en `STRIPE_SECRET_KEY`.
3. Webhook: en Stripe → Developers → Webhooks → Add endpoint → `https://TU-API.onrender.com/stripe/webhook` → eventos `checkout.session.completed` y `customer.subscription.deleted`. Copiar el secreto `whsec_...` a `STRIPE_WEBHOOK_SECRET` y reiniciar Render.
4. Probar con la tarjeta `4242 4242 4242 4242`, fecha futura, CVC `123`.
5. El idempotente ya está hecho: cada `event.id` se guarda en `eventos_stripe`.

### Paso 5 — Resend (opcional pero suma puntos)

1. Crear clave en Resend y ponerla en `RESEND_API_KEY`. Confirma que `NODE_ENV=production` en Render; si no, el enlace se seguirá imprimiendo en los logs.
2. Para el correo de la cuenta de Resend sirve `onboarding@resend.dev`. Para otros destinatarios hay que verificar un dominio con SPF/DKIM/DMARC y cambiar `CORREO_REMITENTE`.
3. Prueba real: registrarse con correo propio → abrir enlace `/verificar-correo?token=...` → entrar.

### Paso 5b — Gemini (opcional pero suma puntos)

1. En Google AI Studio crea una clave API y cópiala en `GEMINI_API_KEY` de Render. Reinicia el servicio.
2. Entra como maestro, abre una lección y usa «Generar tarjetas con IA desde un documento» con un PDF o DOCX pequeño.
3. Edita, descarta y guarda las sugerencias. La clave nunca se envía al navegador: solo llama a Gemini el backend.
4. Sin clave, el botón devuelve el aviso `gemini_sin_configuracion` y el resto del editor sigue funcionando.

### Paso 6 — GitHub Actions

Al hacer push, `.github/workflows/ci.yml` instala dependencias, corre `npm audit`, las pruebas, aplica migraciones a PostgreSQL real y compila el frontend. Comprobar que el check aparece en verde en la pestaña *Actions*. Si falla, leer el log antes de seguir.

## 5. Verificación final

```powershell
# API pública
Invoke-RestMethod https://TU-API.onrender.com/salud

# Desde el navegador
https://TU-FRONTEND.vercel.app/                       # portada
https://TU-FRONTEND.vercel.app/login                  # login
https://TU-FRONTEND.vercel.app/registro-alumno        # registro con RUSO123
https://TU-FRONTEND.vercel.app/herramientas/ruso      # cirílico y audio
https://TU-API.onrender.com/auth/yo                   # sin token -> 401 esperado
```

Checklist:

- [ ] `git remote -v` muestra el repo y `git status` está limpio.
- [ ] `/salud` responde en la URL pública.
- [ ] Login con `ana@ejemplo.es` / `123456` entra y muestra el panel de maestro.
- [ ] Registro de alumno con `RUSO123` funciona y el correo de verificación llega (o se simula).
- [ ] Quiz y repaso guardan XP/racha en Neon.
- [ ] `FRONTEND_URL` coincide con la URL real de Vercel.
- [ ] Actions en verde.
- [ ] Ningún `.env` ni clave subida a GitHub.

## 6. Problemas típicos y solución rápida

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Faltan variables de entorno: DATABASE_URL, JWT_SECRET` | vars no puestas en Render | añadirlas y reiniciar |
| Error de conexión a BD | `DB_SSL` en `false` o URL sin pooler | `DB_SSL=true` y connection string pooled |
| CORS bloqueado en el navegador | `FRONTEND_URL` distinto o con `/` final | poner la URL exacta y reiniciar |
| Pantalla en blanco en Vercel | `VITE_API_URL` no se inyectó al compilar | configurar variable y hacer redeploy |
| Vite falla en Vercel | Node 18 | configurar Node 22 |
| Primera petición lenta | Render duerme el plan gratuito | avisar al usuario o añadir ping a `/salud` |
| Stripe 400 en webhook | firma con body parseado | el router ya usa `raw`; revisar `STRIPE_WEBHOOK_SECRET` |
| El correo no llega | Remitente `onboarding@resend.dev` solo para cuenta verificada | verificar dominio propio |

---

## 7. Prompt listo para pegar en el chat nuevo

```text
Estoy continuando el proyecto "entrenador-ruso" desde otro chat. Lee el archivo HANDOFF_HOSTING.md en C:\Users\popus\Downloads\entrenador-ruso (y GUIA_DESPLIEGUE.md si hace falta) y sigue exactamente ese contexto.

Resumen: SaaS en español para maestros, backend Node/Express + PostgreSQL Neon, frontend React/Vite. Todo funciona en local con Neon, 66 pruebas en verde, commit 79a5f9b, sin remoto de GitHub y sin deploy. Quiero publicarlo en planes gratuitos: GitHub + Render (API) + Vercel (frontend), con Stripe en modo prueba y Resend después.

Reglas: responder en español, Sin preguntar "¿sigo?", trabajar hasta el final y verificar todo al terminar. No tocar backend/src/servicios/panel.servicio.js ni frontend/src/paginas/PanelAlumno.jsx (decisión mía ya probada). Secretos solo en .env/secretos del proveedor, nunca en Git. Usa PostgreSQL/Neon, nunca XAMPP. Dame comandos PowerShell cuando haga falta y explica cada paso en corto, como para junior.

Empieza comprobando git status y git remote -v, y dime qué tengo que hacer en orden.
```
