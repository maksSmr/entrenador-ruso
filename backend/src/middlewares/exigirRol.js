import { ErrorApi } from '../utilidades/errorApi.js';

// 403 = sí hay sesión, pero el rol no permite la acción.
export function exigirRol(rolPermitido) {
  return (req, _res, next) => {
    if (req.usuario?.rol !== rolPermitido) {
      return next(new ErrorApi(403, `Se requiere el rol ${rolPermitido}`, 'sin_permiso'));
    }
    return next();
  };
}
