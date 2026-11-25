import 'dotenv/config';
import { GEMINI_MODELO_POR_DEFECTO } from './gemini.js';

const requeridas = ['DATABASE_URL', 'JWT_SECRET'];
const faltantes = requeridas.filter((nombre) => !process.env[nombre]);

if (faltantes.length) {
  throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}. Copia .env.example a .env.`);
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const origenesLocales = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

export const entorno = {
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL,
  dbSsl: process.env.DB_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpira: process.env.JWT_EXPIRA ?? '7d',
  puerto: Number(process.env.PORT || 3000),
  frontendUrl,
  // En producción solo se permite la URL configurada; en desarrollo se añaden los puertos de Vite.
  origenesPermitidos: nodeEnv === 'production'
    ? [frontendUrl]
    : [...new Set([frontendUrl, ...origenesLocales])],
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  correoRemitente: process.env.CORREO_REMITENTE ?? 'Entrenador de Idiomas <onboarding@resend.dev>',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  stripePrecioPro: process.env.STRIPE_PRECIO_PRO ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModelo: process.env.GEMINI_MODELO || GEMINI_MODELO_POR_DEFECTO,
};
