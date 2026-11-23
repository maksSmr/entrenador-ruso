import { pool } from '../config/baseDatos.js';
import { obtenerPlan, planPorDefecto } from '../config/planes.js';
import { ROLES } from '../utilidades/constantes.js';
import { ErrorApi } from '../utilidades/errorApi.js';

export async function leerPlan(maestroId) {
  const { rows } = await pool.query(
    'SELECT plan FROM suscripciones WHERE maestro_id = $1',
    [maestroId],
  );
  return rows[0]?.plan ?? planPorDefecto;
}

export async function miPlan(usuario) {
  if (usuario.rol !== ROLES.MAESTRO) {
    throw new ErrorApi(403, 'Los planes son solo para maestros', 'sin_permiso');
  }

  const nombrePlan = await leerPlan(usuario.id);
  const configuracion = obtenerPlan(nombrePlan);
  const { rows: cursos } = await pool.query(
    'SELECT COUNT(*)::integer AS total FROM cursos WHERE maestro_id = $1',
    [usuario.id],
  );
  const { rows: alumnos } = await pool.query(
    `SELECT COUNT(DISTINCT i.usuario_id)::integer AS total
       FROM inscripciones i
       JOIN cursos c ON c.id = i.curso_id AND c.maestro_id = $1`,
    [usuario.id],
  );

  return {
    plan: nombrePlan,
    nombre: configuracion.nombre,
    limites: {
      cursos: configuracion.cursos,
      alumnos: configuracion.alumnos,
    },
    uso: {
      cursos: cursos[0].total,
      alumnos: alumnos[0].total,
    },
  };
}

// Devuelve el maestro dueño del código; lo usa el límite de alumnos.
export async function maestroDelCodigo(codigo) {
  const { rows } = await pool.query(
    'SELECT maestro_id FROM cursos WHERE codigo_invitacion = $1',
    [codigo],
  );
  return rows[0]?.maestro_id ?? null;
}

export async function contarRecurso(tipo, maestroId) {
  const consulta = tipo === 'curso'
    ? 'SELECT COUNT(*)::integer AS total FROM cursos WHERE maestro_id = $1'
    : `SELECT COUNT(DISTINCT i.usuario_id)::integer AS total
         FROM inscripciones i
         JOIN cursos c ON c.id = i.curso_id AND c.maestro_id = $1`;

  const { rows } = await pool.query(consulta, [maestroId]);
  return rows[0].total;
}
