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
    // Los tokens emitidos antes de este cambio no traen la claim: se aceptan por compatibilidad.
    if (payload.email_verificado === false) {
      return next(new ErrorApi(
        403,
        'Tu correo aún no está verificado. Revisa tu bandeja o solicita uno nuevo.',
        'correo_no_verificado',
      ));
    }
    req.usuario = { id: payload.id, rol: payload.rol, email_verificado: true };
    return next();
  } catch {
    return next(new ErrorApi(401, 'Token inválido o expirado', 'token_invalido'));
  }
}
