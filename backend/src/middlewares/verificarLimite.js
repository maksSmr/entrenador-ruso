import { obtenerPlan } from '../config/planes.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import { ROLES } from '../utilidades/constantes.js';
import {
  contarRecurso,
  leerPlan,
  maestroDelCodigo,
} from '../servicios/planes.servicio.js';

const MENSAJES = {
  curso: 'Tu plan gratis permite hasta 2 cursos. Mejora a Pro para crear más.',
  alumno: 'Has llegado al límite de alumnos de tu plan.',
};

// La ruta dice 'curso'/'alumno'; el config usa 'cursos'/'alumnos'.
const CLAVES = { curso: 'cursos', alumno: 'alumnos' };

// Se usa después de validar(): req.body ya trae el código si es una inscripción.
export function verificarLimite(tipo) {
  return async (req, _res, next) => {
    try {
      const maestroId = req.usuario.rol === ROLES.MAESTRO
        ? req.usuario.id
        : await maestroDelCodigo(req.body.codigo_invitacion);

      if (!maestroId) return next(); // el código inválido lo reporta el servicio

      const nombrePlan = await leerPlan(maestroId);
      const limite = obtenerPlan(nombrePlan)[CLAVES[tipo]];
      if (limite === null) return next();

      const usados = await contarRecurso(tipo, maestroId);
      if (usados >= limite) {
        return next(new ErrorApi(409, MENSAJES[tipo], 'limite_plan', {
          limite, usados, plan: nombrePlan,
        }));
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
