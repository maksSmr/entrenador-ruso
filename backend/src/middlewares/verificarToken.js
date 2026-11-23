import jwt from 'jsonwebtoken';
import { entorno } from '../config/entorno.js';
import { ErrorApi } from '../utilidades/errorApi.js';

// 401 = no hay sesión válida. Deja req.usuario = { id, rol } para los siguientes middlewares.
export function verificarToken(req, _res, next) {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ');

  if (esquema !== 'Bearer' || !token) {
    return next(new ErrorApi(401, 'Falta el token Bearer', 'sin_token'));
  }

  try {
    const payload = jwt.verify(token, entorno.jwtSecret);
    req.usuario = { id: payload.id, rol: payload.rol };
    return next();
  } catch {
    return next(new ErrorApi(401, 'Token inválido o expirado', 'token_invalido'));
  }
}
