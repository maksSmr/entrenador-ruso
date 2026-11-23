import rateLimit from 'express-rate-limit';

const HORA = 60 * 60 * 1000;

// Reenvío: 3 por hora, contando juntos el correo y la IP (Prompt 2b).
export const limiteReenvio = rateLimit({
  windowMs: HORA,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.body?.email ?? ''}`,
  message: { error: 'Demasiados reenvíos. Intenta de nuevo en una hora.', codigo: 'demasiados_reenvios' },
});

// Login: límite básico para frenar fuerza bruta (Prompt 15).
export const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de acceso. Intenta más tarde.', codigo: 'demasiados_intentos' },
});
