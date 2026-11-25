import { z } from 'zod';
import { ErrorApi } from '../utilidades/errorApi.js';

// Los ids de la URL llegan como texto; los convertimos a entero positivo.
export function validarId(parametro = 'id', destino = 'idCurso') {
  return (req, _res, next) => {
    const resultado = z.coerce.number().int().positive().safeParse(req.params[parametro]);

    if (!resultado.success) {
      return next(new ErrorApi(400, `El parámetro ${parametro} debe ser un entero positivo`, 'id_invalido'));
    }

    req[destino] = resultado.data;
    return next();
  };
}

// Valida el body con Zod y lo reemplaza por la versión limpia (trim, minúsculas...).
export function validar(esquema) {
  return (req, _res, next) => {
    const resultado = esquema.safeParse(req.body);

    if (!resultado.success) {
      const detalles = resultado.error.flatten().fieldErrors;
      const resumen = Object.entries(detalles)
        .map(([campo, mensajes]) => `${campo}: ${mensajes.join(', ')}`)
        .join('; ');
      const mensaje = resumen ? `Datos inválidos (${resumen})` : 'Datos inválidos';
      return next(new ErrorApi(400, mensaje, 'validacion', detalles));
    }

    req.body = resultado.data;
    return next();
  };
}
