import { pool } from '../config/baseDatos.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import { ROLES } from '../utilidades/constantes.js';

const noEncontrado = () => new ErrorApi(404, 'Tarjeta no encontrada', 'no_encontrado');

export async function listarPorLeccion(leccionId, usuario) {
  const consulta = usuario.rol === ROLES.MAESTRO
    ? `SELECT t.* FROM tarjetas t
         JOIN lecciones l ON l.id = t.leccion_id
         JOIN cursos c ON c.id = l.curso_id
        WHERE t.leccion_id = $1 AND c.maestro_id = $2
        ORDER BY t.id`
    : `SELECT t.* FROM tarjetas t
         JOIN lecciones l ON l.id = t.leccion_id AND l.publicada = true
         JOIN inscripciones i ON i.curso_id = l.curso_id AND i.usuario_id = $2
        WHERE t.leccion_id = $1
        ORDER BY t.id`;

  const { rows } = await pool.query(consulta, [leccionId, usuario.id]);
  return rows;
}

export async function crear(leccionId, maestroId, datos) {
  const {
    palabra, transliteracion, traduccion, imagen_url,
    acento_posicion, ejemplo_ruso, ejemplo_traduccion, audio_url, nota_gramatical,
  } = datos;

  const existe = await pool.query(
    `SELECT 1 FROM tarjetas t
       JOIN lecciones l ON l.id = t.leccion_id
       JOIN cursos c ON c.id = l.curso_id
      WHERE t.leccion_id = $1 AND t.palabra = $2 AND c.maestro_id = $3`,
    [leccionId, palabra, maestroId],
  );
  if (existe.rowCount) {
    throw new ErrorApi(409, 'Ya existe esa palabra en la lección', 'palabra_duplicada');
  }

  const { rows } = await pool.query(
    `INSERT INTO tarjetas
       (leccion_id, palabra, transliteracion, traduccion, imagen_url,
        acento_posicion, ejemplo_ruso, ejemplo_traduccion, audio_url, nota_gramatical)
     SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
       FROM lecciones l JOIN cursos c ON c.id = l.curso_id
      WHERE l.id = $1 AND c.maestro_id = $11
     RETURNING *`,
    [leccionId, palabra, transliteracion, traduccion, imagen_url,
      acento_posicion, ejemplo_ruso, ejemplo_traduccion, audio_url, nota_gramatical, maestroId],
  );
  if (!rows.length) throw noEncontrado();
  return rows[0];
}

export async function actualizar(id, maestroId, datos) {
  const actual = await pool.query(
    `SELECT t.id FROM tarjetas t
       JOIN lecciones l ON l.id = t.leccion_id
       JOIN cursos c ON c.id = l.curso_id
      WHERE t.id = $1 AND c.maestro_id = $2`,
    [id, maestroId],
  );
  if (!actual.rowCount) throw noEncontrado();

  const columnas = Object.keys(datos);
  const asignaciones = columnas.map((columna, indice) => `${columna} = $${indice + 1}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE tarjetas SET ${asignaciones}
      WHERE id = $${columnas.length + 1}
        AND leccion_id IN (
          SELECT l.id FROM lecciones l JOIN cursos c ON c.id = l.curso_id
           WHERE c.maestro_id = $${columnas.length + 2})
      RETURNING *`,
    [...columnas.map((columna) => datos[columna]), id, maestroId],
  );
  return rows[0];
}

export async function eliminar(id, maestroId) {
  const { rowCount } = await pool.query(
    `DELETE FROM tarjetas
      WHERE id = $1 AND leccion_id IN (
        SELECT l.id FROM lecciones l JOIN cursos c ON c.id = l.curso_id
         WHERE c.maestro_id = $2)`,
    [id, maestroId],
  );
  if (!rowCount) throw noEncontrado();
}
