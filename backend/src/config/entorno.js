import 'dotenv/config';

const requeridas = ['DATABASE_URL', 'JWT_SECRET'];
const faltantes = requeridas.filter((nombre) => !process.env[nombre]);

if (faltantes.length) {
  throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}. Copia .env.example a .env.`);
}

export const entorno = {
  databaseUrl: process.env.DATABASE_URL,
  dbSsl: process.env.DB_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpira: process.env.JWT_EXPIRA ?? '7d',
  puerto: Number(process.env.PORT ?? 3000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  correoRemitente: process.env.CORREO_REMITENTE ?? 'Entrenador de Idiomas <onboarding@resend.dev>',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  stripePrecioPro: process.env.STRIPE_PRECIO_PRO ?? '',
};
