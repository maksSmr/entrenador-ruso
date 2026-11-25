import { pool } from '../config/baseDatos.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import { siguienteRevision } from '../utilidades/leitner.js';
import { actualizarRacha, nivelPorXp } from '../utilidades/racha.js';

const noEncontrado = () => new ErrorApi(404, 'Tarjeta no encontrada en tus cursos', 'no_encontrado');

export async function repasoDeHoy(cursoId, usuarioId) {
  const { rows } = await pool.query(
    `SELECT t.id, t.palabra, t.transliteracion, t.traduccion,
            t.imagen_url, t.acento_posicion, t.ejemplo_ruso,
            COALESCE(p.caja, 1) AS caja,
            COALESCE(p.proxima_revision, CURRENT_DATE) AS proxima_revision,
            COALESCE(p.sin_xp, false) AS sin_xp
       FROM tarjetas t
       JOIN lecciones l ON l.id = t.leccion_id AND l.publicada = true
       LEFT JOIN progreso_tarjetas p
              ON p.tarjeta_id = t.id AND p.usuario_id = $2
      WHERE l.curso_id = $1
        AND COALESCE(p.proxima_revision, CURRENT_DATE) <= CURRENT_DATE
      ORDER BY COALESCE(p.caja, 1), t.id
      LIMIT 20`,
    [cursoId, usuarioId],
  );
  return rows;
}

export async function responder(tarjetaId, acerto, usuarioId, fecha = new Date()) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const { rows } = await cliente.query(
      `SELECT t.id, l.curso_id
         FROM tarjetas t
         JOIN lecciones l ON l.id = t.leccion_id AND l.publicada = true
         JOIN inscripciones i ON i.curso_id = l.curso_id AND i.usuario_id = $2
        WHERE t.id = $1`,
      [tarjetaId, usuarioId],
    );
    if (!rows.length) throw noEncontrado();

    const actual = await cliente.query(
      'SELECT caja, sin_xp FROM progreso_tarjetas WHERE usuario_id = $1 AND tarjeta_id = $2',
      [usuarioId, tarjetaId],
    );
    const cajaActual = actual.rows.length ? actual.rows[0].caja : 1;
    const sinXp = Boolean(actual.rows[0]?.sin_xp);
    const destino = siguienteRevision(cajaActual, acerto, fecha);

    await cliente.query(
      // No sobrescribimos sin_xp: una vez reiniciada, esa tarjeta no vuelve a dar XP.
      `INSERT INTO progreso_tarjetas (usuario_id, tarjeta_id, caja, proxima_revision)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_id, tarjeta_id)
       DO UPDATE SET caja = EXCLUDED.caja, proxima_revision = EXCLUDED.proxima_revision`,
      [usuarioId, tarjetaId, destino.caja, destino.proxima_revision],
    );

    // Historial para el reporte: así "tarjetas más falladas" son datos reales.
    await cliente.query(
      'INSERT INTO respuestas_repaso (usuario_id, tarjeta_id, acerto) VALUES ($1, $2, $3)',
      [usuarioId, tarjetaId, acerto],
    );

    // Solo suma XP cuando el acierto hace subir de caja. Repetir "Lo sabía" en la caja 5 no da XP.
    let xpGanado = 0;
    let xpTotal = null;
    let racha = null;
    let nivel = null;

    if (acerto && destino.caja > cajaActual && !sinXp) {
      const usuario = await cliente.query(
        'SELECT xp, racha, ultima_actividad FROM usuarios WHERE id = $1 FOR UPDATE',
        [usuarioId],
      );
      if (!usuario.rows.length) throw noEncontrado();

      const anterior = usuario.rows[0];
      const nuevoEstado = actualizarRacha(anterior.ultima_actividad, anterior.racha, fecha);
      const bonusRacha =
        nuevoEstado.racha !== anterior.racha && nuevoEstado.racha % 7 === 0 ? 10 : 0;
      xpGanado = 10 + bonusRacha;
      xpTotal = anterior.xp + xpGanado;
      racha = nuevoEstado.racha;
      nivel = nivelPorXp(xpTotal);

      await cliente.query(
        `UPDATE usuarios SET xp = $1, racha = $2, ultima_actividad = $3 WHERE id = $4`,
        [xpTotal, racha, nuevoEstado.ultima_actividad, usuarioId],
      );
    }

    await cliente.query('COMMIT');

    return { ...destino, xp_ganado: xpGanado, xp_total: xpTotal, racha, nivel, sin_xp: sinXp };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

/**
 * Devuelve al día de hoy todas las tarjetas publicadas del curso para este alumno.
 * Las marca sin XP: ya fueron premiadas en su primera ronda, así que repasarlas
 * no puede inflar el XP ni la racha. Solo afecta a las tarjetas del curso del alumno.
 */
export async function reiniciar(cursoId, usuarioId) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const { rowCount } = await cliente.query(
      `INSERT INTO progreso_tarjetas (usuario_id, tarjeta_id, caja, proxima_revision, sin_xp)
       SELECT $1, t.id, 1, CURRENT_DATE, true
         FROM tarjetas t
         JOIN lecciones l ON l.id = t.leccion_id AND l.publicada = true
        WHERE l.curso_id = $2
       ON CONFLICT (usuario_id, tarjeta_id)
       DO UPDATE SET caja = 1, proxima_revision = CURRENT_DATE, sin_xp = true`,
      [usuarioId, cursoId],
    );
    await cliente.query('COMMIT');
    return { reiniciadas: rowCount };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
