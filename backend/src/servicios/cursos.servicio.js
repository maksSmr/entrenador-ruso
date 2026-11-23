import { pool } from '../config/baseDatos.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import { generarCodigoInvitacion } from '../utilidades/codigo.js';

const noEncontrado = () => new ErrorApi(404, 'Curso no encontrado', 'no_encontrado');

// Reintentos por si el azar repite un código ya usado.
async function codigoUnico(cliente = pool) {
  for (let intento = 0; intento < 10; intento += 1) {
    const codigo = generarCodigoInvitacion();
    const { rowCount } = await cliente.query(
      'SELECT 1 FROM cursos WHERE codigo_invitacion = $1',
      [codigo],
    );
    if (!rowCount) return codigo;
  }
  throw new ErrorApi(500, 'No se pudo generar un código único', 'codigo_no_generado');
}

export async function listarPorMaestro(maestroId) {
  const { rows } = await pool.query(
    'SELECT * FROM cursos WHERE maestro_id = $1 ORDER BY creado_en DESC',
    [maestroId],
  );
  return rows;
}

export async function obtenerPorId(id, maestroId) {
  const { rows } = await pool.query(
    'SELECT * FROM cursos WHERE id = $1 AND maestro_id = $2',
    [id, maestroId],
  );
  if (!rows.length) throw noEncontrado();
  return rows[0];
}

export async function crear(maestroId, datos) {
  const { nombre, idioma, descripcion } = datos;
  const codigo = await codigoUnico();
  const { rows } = await pool.query(
    `INSERT INTO cursos (maestro_id, nombre, idioma, descripcion, codigo_invitacion)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [maestroId, nombre, idioma, descripcion ?? '', codigo],
  );
  return rows[0];
}

export async function actualizar(id, maestroId, datos) {
  await obtenerPorId(id, maestroId);

  const columnas = Object.keys(datos);
  const asignaciones = columnas.map((columna, indice) => `${columna} = $${indice + 1}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE cursos SET ${asignaciones}
      WHERE id = $${columnas.length + 1} AND maestro_id = $${columnas.length + 2}
      RETURNING *`,
    [...columnas.map((columna) => datos[columna]), id, maestroId],
  );
  return rows[0];
}

export async function eliminar(id, maestroId) {
  const { rowCount } = await pool.query(
    'DELETE FROM cursos WHERE id = $1 AND maestro_id = $2',
    [id, maestroId],
  );
  if (!rowCount) throw noEncontrado();
}

export async function regenerarCodigo(id, maestroId) {
  await obtenerPorId(id, maestroId);
  const codigo = await codigoUnico();
  const { rows } = await pool.query(
    `UPDATE cursos SET codigo_invitacion = $1
      WHERE id = $2 AND maestro_id = $3 RETURNING *`,
    [codigo, id, maestroId],
  );
  return rows[0];
}

// El JOIN con cursos filtra por dueño aunque el middleware ya lo haya validado.
export async function listarAlumnos(id, maestroId) {
  await obtenerPorId(id, maestroId);
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.xp, u.racha, u.ultima_actividad, i.fecha AS inscrito_en
       FROM inscripciones i
       JOIN usuarios u ON u.id = i.usuario_id
       JOIN cursos c ON c.id = i.curso_id AND c.maestro_id = $2
      WHERE i.curso_id = $1
      ORDER BY u.nombre`,
    [id, maestroId],
  );
  return rows;
}

export async function inscribirConCodigo(usuarioId, codigo) {
  const { rows } = await pool.query(
    'SELECT id, nombre, idioma FROM cursos WHERE codigo_invitacion = $1',
    [codigo],
  );
  if (!rows.length) {
    throw new ErrorApi(400, 'Código de invitación no válido', 'codigo_invalido');
  }

  const curso = rows[0];
  const yaInscrito = await pool.query(
    'SELECT 1 FROM inscripciones WHERE usuario_id = $1 AND curso_id = $2',
    [usuarioId, curso.id],
  );
  if (yaInscrito.rowCount) {
    throw new ErrorApi(409, 'Ya estás inscrito en este curso', 'ya_inscrito');
  }

  await pool.query(
    'INSERT INTO inscripciones (usuario_id, curso_id) VALUES ($1, $2)',
    [usuarioId, curso.id],
  );
  return curso;
}

export async function listarMisCursos(usuarioId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.nombre, c.idioma, c.descripcion, i.fecha AS inscrito_en
       FROM inscripciones i
       JOIN cursos c ON c.id = i.curso_id
      WHERE i.usuario_id = $1
      ORDER BY i.fecha DESC`,
    [usuarioId],
  );
  return rows;
}
