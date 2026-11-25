import { pool } from '../config/baseDatos.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import { generarPreguntas } from '../utilidades/quiz.js';
import { actualizarRacha, nivelPorXp } from '../utilidades/racha.js';
import { ROLES } from '../utilidades/constantes.js';

const noEncontrado = () => new ErrorApi(404, 'Lección no encontrada en tus cursos', 'no_encontrado');

export async function generarQuiz(leccionId, cantidad = 4, usuario) {
  const consulta = usuario?.rol === ROLES.MAESTRO
    ? `SELECT t.id, t.palabra, t.transliteracion, t.traduccion
         FROM tarjetas t
         JOIN lecciones l ON l.id = t.leccion_id
         JOIN cursos c ON c.id = l.curso_id
        WHERE t.leccion_id = $1 AND c.maestro_id = $2
        ORDER BY t.id`
    : `SELECT t.id, t.palabra, t.transliteracion, t.traduccion
         FROM tarjetas t
         JOIN lecciones l ON l.id = t.leccion_id AND l.publicada = true
         JOIN inscripciones i ON i.curso_id = l.curso_id AND i.usuario_id = $2
        WHERE t.leccion_id = $1
        ORDER BY t.id`;

  const { rows } = await pool.query(consulta, [leccionId, usuario?.id]);
  return generarPreguntas(rows, cantidad);
}

export async function guardarResultado({ leccion_id, puntaje, total }, usuarioId, fecha = new Date()) {
  if (puntaje > total) {
    throw new ErrorApi(400, 'El puntaje no puede superar el total de preguntas', 'puntaje_invalido');
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const leccion = await cliente.query(
      `SELECT l.id FROM lecciones l
         JOIN inscripciones i ON i.curso_id = l.curso_id AND i.usuario_id = $2
        WHERE l.id = $1 AND l.publicada = true`,
      [leccion_id, usuarioId],
    );
    if (!leccion.rows.length) throw noEncontrado();

    const usuario = await cliente.query(
      'SELECT xp, racha, ultima_actividad FROM usuarios WHERE id = $1 FOR UPDATE',
      [usuarioId],
    );
    if (!usuario.rows.length) throw noEncontrado();

    await cliente.query(
      `INSERT INTO resultados_quiz (usuario_id, leccion_id, puntaje, total_preguntas)
       VALUES ($1, $2, $3, $4)`,
      [usuarioId, leccion_id, puntaje, total],
    );

    const anterior = usuario.rows[0];
    const nuevoEstado = actualizarRacha(anterior.ultima_actividad, anterior.racha, fecha);
    const xpBase = puntaje * 10;
    const bonusPerfecto = puntaje === total ? 20 : 0;
    // El bonus se da al llegar a 7/14/21… una vez, no en cada quiz del mismo día.
    const bonusRacha = nuevoEstado.racha !== anterior.racha && nuevoEstado.racha % 7 === 0 ? 10 : 0;
    const xpGanado = xpBase + bonusPerfecto + bonusRacha;
    const xpTotal = anterior.xp + xpGanado;

    await cliente.query(
      `UPDATE usuarios SET xp = $1, racha = $2, ultima_actividad = $3 WHERE id = $4`,
      [xpTotal, nuevoEstado.racha, nuevoEstado.ultima_actividad, usuarioId],
    );

    await cliente.query('COMMIT');

    return {
      xp_ganado: xpGanado,
      xp_total: xpTotal,
      racha: nuevoEstado.racha,
      nivel: nivelPorXp(xpTotal),
      desglose: { xpBase, bonusPerfecto, bonusRacha },
    };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
