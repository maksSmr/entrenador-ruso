# Guía de despliegue (todo en planes gratuitos)

## 1. Base de datos (Neon o Supabase)

1. Crea un proyecto. Elige la región más cercana.
2. Copia el **connection string** (en Neon: *Connection string* → *Pooled*; en Supabase: *Settings → Database → Connection string*).
3. En el SQL Editor ejecuta, **en este orden**, los archivos de `backend/migraciones/001...006` y luego `backend/semillas/001_datos_ejemplo.sql`.
4. Guarda el connection string como secreto `DATABASE_URL`. Usa `DB_SSL=true`.

> Para desarrollo local con PostgreSQL instalado: `DB_SSL=false` y una URL tipo `postgresql://postgres:TU_CLAVE@localhost:5432/entrenador_ruso`.

## 2. API en Render

1. *New → Web Service* → conecta el repositorio.
2. Runtime: **Node**. Root directory: `backend`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Variables de entorno:

| Variable | Ejemplo / origen |
|---|---|
| `DATABASE_URL` | connection string de Neon/Supabase |
| `DB_SSL` | `true` |
| `JWT_SECRET` | clave larga y aleatoria (generador de contraseñas) |
| `JWT_EXPIRA` | `7d` |
| `PORT` | Render lo asigna; déjalo vacío o `3000` |
| `FRONTEND_URL` | URL de Vercel del frontend |
| `RESEND_API_KEY` | clave de Resend (vacía = correo simulado) |
| `CORREO_REMITENTE` | `Entrenador de Idiomas <onboarding@resend.dev>` |
| `STRIPE_SECRET_KEY` | clave **de prueba** `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | secreto del webhook `whsec_...` |
| `STRIPE_PRECIO_PRO` | ID del precio recurrente `price_...` |

6. Tras desplegar, comprueba `https://TU-API.onrender.com/salud`.

## 3. Frontend en Vercel

1. *Add New → Project* → conecta el repositorio.
2. Root directory: `frontend`. Framework: **Vite**.
3. Ajusta la versión de Node a **20.19+ o 22+** (la exige Vite 7). Build command: `npm run build`. Output: `dist`.
4. Variable de entorno: `VITE_API_URL=https://TU-API.onrender.com`.
5. Despliega y comprueba que `/login` carga.

En `vite.config.js` esa variable se inyecta con `define`; no hace falta reconstruir la API.

## 4. Correo con Resend

- Sin `RESEND_API_KEY`, la API imprime el enlace de verificación en la consola. Es ideal para desarrollar.
- Con clave, configura `CORREO_REMITENTE`. `onboarding@resend.dev` solo funciona para el correo de tu cuenta de Resend; para otros destinatarios verifica tu dominio.

### Verificar dominio en Resend (para no llegar a spam)

1. Resend → *Domains* → *Add domain* → escribe `tudominio.com`.
2. Resend te dará registros **SPF** (TXT), **DKIM** (TXT/CNAME) y, si lo pide, **DMARC** (TXT).
3. Cópialos en la configuración DNS de tu proveedor (Cloudflare, GoDaddy, etc.). Espera la verificación (puede tardar unas horas).
4. Cambia `CORREO_REMITENTE` a algo como `Entrenador de Idiomas <hola@tudominio.com>`.
5. Prueba de extremo a extremo en producción: regístrate con tu correo real, revisa la bandeja (y spam), abre el enlace `/verificar-correo?token=...`, confirma y comprueba que el login ya funciona.

## 5. Stripe en modo prueba

1. En Stripe → *Product Catalog* → crea un producto **Pro** con precio mensual recurrente. Copia el `price_...` a `STRIPE_PRECIO_PRO`.
2. Usa la clave secreta `sk_test_...` en la API (nunca la pública en el frontend).
3. Instala la CLI de Stripe y reenvía eventos a tu API:

```bash
stripe listen --forward-to http://localhost:3000/stripe/webhook
# La CLI imprime un secreto whsec_...: ponlo en STRIPE_WEBHOOK_SECRET y reinicia la API.
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

4. Tarjetas de prueba: `4242 4242 4242 4242`, cualquier fecha futura y CVC `123`.
5. El webhook guarda cada `event.id` en `eventos_stripe`: reenviar el mismo evento no aplica dos veces el cambio de plan.

## 6. GitHub Actions

El workflow `.github/workflows/ci.yml` ya:

- instala dependencias con `npm ci`,
- ejecuta `npm audit`,
- corre las pruebas de backend y frontend,
- aplica todas las migraciones y semillas a un PostgreSQL real,
- compila el frontend.

En el repo, activa Actions y protege la rama principal si quieres que todo pase antes de fusionar.

## 7. Limitaciones de los planes gratuitos

- **Render** duerme el servicio tras ~15 min sin peticiones; la primera llamada puede tardar 30-60 s. Mitigación: un ping programado (cron gratuito) a `/salud`, o avisar al usuario de esa primera espera.
- **Vercel/Netlify** son gratis para el frontend estático; no sirven para la API con Postgres persistente.
- **Neon/Supabase** tienen cuotas de almacenamiento y conexiones. Usa el pooler y el `DB_SSL=true`.
- **Resend** tiene límite diario de correos; en desarrollo no gastes clave y usa el correo simulado por consola.
- **Stripe** solo en modo prueba hasta que tengas dominio, datos fiscales y política de devoluciones.

## 8. Lista de revisión de seguridad

- [x] Secretos solo en `.env` / secretos del proveedor; `.env` ignorado por Git.
- [x] Contraseñas hasheadas con bcrypt (10 rondas); tokens guardados solo como SHA-256.
- [x] Validación de todo el cuerpo con Zod antes de tocar la BD.
- [x] Rate limit en login (10/15 min) y reenvío de correo (3/h por IP + correo).
- [x] HTTPS en producción (Render/Vercel lo dan por defecto) y CORS limitado a `FRONTEND_URL`.
- [x] Webhook de Stripe con verificación de firma e idempotencia.
- [x] Consultas SQL parametrizadas y filtradas por maestro/curso inscrito.
- [ ] Antes de la defensa: revisa `git log` y `git status` para confirmar que no se subió ningún `.env` ni clave.

## 9. Cambios de plan gratuito -> pro

- `POST /suscripcion/checkout` devuelve una URL de Stripe Checkout.
- `POST /suscripcion/portal` devuelve la URL del portal del cliente para cancelar/cambiar tarjeta.
- `GET /mi-plan` muestra plan, límites y uso actual.
- Gratis: 2 cursos y 10 alumnos. Pro: cursos ilimitados y 50 alumnos.
