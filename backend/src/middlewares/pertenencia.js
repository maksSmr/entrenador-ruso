import { pool } from '../config/baseDatos.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import { ROLES } from '../utilidades/constantes.js';

// Si el recurso es de otro maestro se responde 404, nunca 403: no revelamos que existe.
const noEncontrado = () => new ErrorApi(404, 'Recurso no encontrado', 'no_encontrado');

export async function cursoDelMaestro(req, _res, next, destino = 'idCurso') {
  const { rows } = await pool.query(
    'SELECT id FROM cursos WHERE id = $1 AND maestro_id = $2',
    [req[destino], req.usuario.id],
  );
  if (!rows.length) return next(noEncontrado());
  return next();
}

export async function accesoCurso(req, _res, next) {
  const { rows } = await pool.query(
    `SELECT c.id FROM cursos c
       JOIN inscripciones i ON i.curso_id = c.id AND i.usuario_id = $2
      WHERE c.id = $1`,
    [req.idCurso, req.usuario.id],
  );
  if (!rows.length) return next(noEncontrado());
  return next();
}

export async function leccionDelMaestro(req, _res, next) {
  const { rows } = await pool.query(
    `SELECT l.id, l.curso_id FROM lecciones l
       JOIN cursos c ON c.id = l.curso_id
      WHERE l.id = $1 AND c.maestro_id = $2`,
    [req.idLeccion, req.usuario.id],
  );
  if (!rows.length) return next(noEncontrado());
  req.idCurso = rows[0].curso_id;
  return next();
}

export async function accesoLeccion(req, _res, next) {
  const { rows } = await pool.query(
    `SELECT l.id, l.curso_id FROM lecciones l
       JOIN inscripciones i ON i.curso_id = l.curso_id AND i.usuario_id = $2
      WHERE l.id = $1 AND l.publicada = true`,
    [req.idLeccion, req.usuario.id],
  );
  if (!rows.length) return next(noEncontrado());
  req.idCurso = rows[0].curso_id;
  return next();
}

export async function tarjetaDelMaestro(req, _res, next) {
  const { rows } = await pool.query(
    `SELECT t.id, t.leccion_id, l.curso_id FROM tarjetas t
       JOIN lecciones l ON l.id = t.leccion_id
       JOIN cursos c ON c.id = l.curso_id
      WHERE t.id = $1 AND c.maestro_id = $2`,
    [req.idTarjeta, req.usuario.id],
  );
  if (!rows.length) return next(noEncontrado());
  req.idCurso = rows[0].curso_id;
  return next();
}

// Un solo middleware para los dos roles: maestro dueño o alumno inscrito.
export async function accesoSegunRol(req, res, next) {
  if (req.usuario.rol === ROLES.MAESTRO) {
    return cursoDelMaestro(req, res, next);
  }
  return accesoCurso(req, res, next);
}

// Igual, pero para una lección: maestro dueño o alumno inscrito y lección publicada.
export async function accesoLeccionSegunRol(req, res, next) {
  if (req.usuario.rol === ROLES.MAESTRO) {
    return leccionDelMaestro(req, res, next);
  }
  return accesoLeccion(req, res, next);
}
