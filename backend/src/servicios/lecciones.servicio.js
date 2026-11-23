import { pool } from '../config/baseDatos.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import { ROLES } from '../utilidades/constantes.js';

const noEncontrado = () => new ErrorApi(404, 'Lección no encontrada', 'no_encontrado');

export async function listarPorCurso(cursoId, usuario) {
  // Doble filtro: inscripción/publicada para alumnos, maestro dueño para maestros.
  const consulta = usuario.rol === ROLES.MAESTRO
    ? `SELECT l.* FROM lecciones l
         JOIN cursos c ON c.id = l.curso_id
        WHERE l.curso_id = $1 AND c.maestro_id = $2
        ORDER BY l.fecha_asignada DESC NULLS LAST, l.orden, l.id`
    : `SELECT l.* FROM lecciones l
         JOIN inscripciones i ON i.curso_id = l.curso_id AND i.usuario_id = $2
        WHERE l.curso_id = $1 AND l.publicada = true
        ORDER BY l.fecha_asignada DESC NULLS LAST, l.orden, l.id`;

  const { rows } = await pool.query(consulta, [cursoId, usuario.id]);
  return rows;
}

export async function obtenerPorId(id, maestroId) {
  const { rows } = await pool.query(
    `SELECT l.* FROM lecciones l
       JOIN cursos c ON c.id = l.curso_id
      WHERE l.id = $1 AND c.maestro_id = $2`,
    [id, maestroId],
  );
  if (!rows.length) throw noEncontrado();
  return rows[0];
}

export async function crear(cursoId, maestroId, datos) {
  const { titulo, descripcion, orden, publicada, unidad_libro, fecha_asignada } = datos;
  const { rows } = await pool.query(
    `INSERT INTO lecciones
       (curso_id, titulo, descripcion, orden, publicada, unidad_libro, fecha_asignada)
     SELECT $1, $2, $3, $4, $5, $6, $7
       FROM cursos WHERE id = $1 AND maestro_id = $8
     RETURNING *`,
    [cursoId, titulo, descripcion, orden, publicada, unidad_libro, fecha_asignada, maestroId],
  );
  if (!rows.length) throw noEncontrado();
  return rows[0];
}

export async function actualizar(id, maestroId, datos) {
  await obtenerPorId(id, maestroId);
  const columnas = Object.keys(datos);
  const asignaciones = columnas.map((columna, indice) => `${columna} = $${indice + 1}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE lecciones SET ${asignaciones}
      WHERE id = $${columnas.length + 1}
        AND curso_id IN (SELECT id FROM cursos WHERE maestro_id = $${columnas.length + 2})
      RETURNING *`,
    [...columnas.map((columna) => datos[columna]), id, maestroId],
  );
  return rows[0];
}

export async function eliminar(id, maestroId) {
  const { rowCount } = await pool.query(
    `DELETE FROM lecciones
      WHERE id = $1 AND curso_id IN (SELECT id FROM cursos WHERE maestro_id = $2)`,
    [id, maestroId],
  );
  if (!rowCount) throw noEncontrado();
}
