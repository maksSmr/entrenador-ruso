# Despliegue gratuito (Render + Vercel + Neon)

Todo el código ya está preparado para desplegarse sin servidor propio. Solo hacen falta tres cuentas: **GitHub**, **Neon** (PostgreSQL) y los servicios que quieras activar (Render/Vercel). La base de datos Neon actual ya tiene las migraciones `001` a `007` y la semilla aplicadas.

## 1. Lo que ya está resuelto en el código

- `backend/src/app.js`: CORS acepta `FRONTEND_URL` y, en desarrollo, los puertos locales `5173`/`4173`.
- `backend/src/config/entorno.js`: `PORT` usa `process.env.PORT || 3000`; añade `NODE_ENV`, `GEMINI_API_KEY` y `GEMINI_MODELO`.
- `backend/src/servicios/correo.js`: con Resend y `NODE_ENV=production` envía correos reales; sin clave o en desarrollo imprime el enlace y no rompe el registro.
- `frontend/vite.config.js` y `frontend/src/servicios/api.js`: `VITE_API_URL` se lee al compilar, con respaldo `http://localhost:3000`.
- Secretos: solo se leen en el backend. Ningún `.env` se sube a Git.

## 2. Variables de entorno

### Backend (Render → Environment)

| Variable | Obligatoria | Valor de ejemplo |
|---|---|---|
| `DATABASE_URL` | sí | connection string **pooled** de Neon |
| `JWT_SECRET` | sí | clave larga y aleatoria |
| `DB_SSL` | sí en Neon | `true` |
| `JWT_EXPIRA` | no | `7d` |
| `PORT` | no | Render lo asigna; local `3000` |
| `FRONTEND_URL` | sí en producción | `https://TU-FRONTEND.vercel.app` |
| `NODE_ENV` | sí en producción | `production` |
| `RESEND_API_KEY` | no | clave de Resend |
| `CORREO_REMITENTE` | no | `Entrenador de Idiomas <onboarding@resend.dev>` |
| `GEMINI_API_KEY` | no | clave de Google AI Studio |
| `GEMINI_MODELO` | no | `gemini-2.5-flash` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRECIO_PRO` | no | modo prueba |

### Frontend (Vercel → Environment Variables)

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://TU-API.onrender.com` (sin barra final) |

## 3. Migraciones SQL

En una BD nueva, ejecuta en el SQL Editor de Neon **en este orden**:

1. `backend/migraciones/001_crear_tablas.sql`
2. `backend/migraciones/002_verificacion_correo.sql`
3. `backend/migraciones/003_herramientas_ruso.sql`
4. `backend/migraciones/004_lecciones_libro.sql`
5. `backend/migraciones/005_webhook_idempotencia.sql`
6. `backend/migraciones/006_respuestas_repaso.sql`
7. `backend/migraciones/007_verificacion_y_gemini.sql`
8. `backend/semillas/001_datos_ejemplo.sql`

La `007` es idempotente: añade `token_verificacion_hash` y `expiracion_token_verificacion` a `usuarios`, y `nota_gramatical` a `tarjetas`.

## 4. Comandos en local (PowerShell)

```powershell
cd backend
npm install
npm test
npm audit --audit-level=high
npm run dev          # http://localhost:3000/salud

cd ../frontend
npm install
npm test
npm audit --audit-level=high
npm run dev          # http://localhost:5173
npm run build        # genera dist/
```

Si añadiste dependencias, los lockfiles ya quedaron actualizados con `npm install pdf-parse@1.1.1 mammoth --save` en `backend`. Para replicar exactamente en CI o producción usa `npm ci`.

## 5. Publicar

```powershell
git remote add origin https://github.com/TU_USUARIO/entrenador-ruso.git
git branch -M main
git push -u origin main
```

1. **Render** → *New Web Service* → Root directory `backend`, build `npm install`, start `npm start`. Carga las variables del backend y comprueba `/salud`.
2. **Vercel** → *Add New Project* → Root directory `frontend`, Framework **Vite**, Node **22**, build `npm run build`, output `dist`. Carga `VITE_API_URL`.
3. Copia la URL de Vercel a `FRONTEND_URL` en Render y reinicia. Sin este paso habrá error de CORS.
4. Opcional: configura Resend, Gemini y Stripe con las claves reales y reinicia Render.

## 6. Comprobación rápida

```powershell
Invoke-RestMethod https://TU-API.onrender.com/salud                 # {"estado":"ok"}
Invoke-RestMethod https://TU-API.onrender.com/auth/yo              # 401 esperado
```

En el navegador: `/login` con `ana@ejemplo.es` / `123456`, registro de alumno con `RUSO123`, y en una lección del panel de maestro probar «Generar tarjetas con IA desde un documento». Sin `GEMINI_API_KEY` debe aparecer un aviso claro, no una pantalla rota.
