import { randomBytes, createHash } from 'node:crypto';

// El token viaja en el correo; en la BD solo guardamos su hash SHA-256.
export const generarToken = () => randomBytes(32).toString('hex');

export const hashToken = (token) =>
  createHash('sha256').update(token).digest('hex');
