import { pool } from '../config/baseDatos.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import { siguienteRevision } from '../utilidades/leitner.js';

const noEncontrado = () => new ErrorApi(404, 'Tarjeta no encontrada en tus cursos', 'no_encontrado');

export async function repasoDeHoy(cursoId, usuarioId) {
  const { rows } = await pool.query(
    `SELECT t.id, t.palabra, t.transliteracion, t.traduccion,
            t.imagen_url, t.acento_posicion, t.ejemplo_ruso,
            COALESCE(p.caja, 1) AS caja,
            COALESCE(p.proxima_revision, CURRENT_DATE) AS proxima_revision
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
  const { rows } = await pool.query(
    `SELECT t.id, l.curso_id
       FROM tarjetas t
       JOIN lecciones l ON l.id = t.leccion_id AND l.publicada = true
       JOIN inscripciones i ON i.curso_id = l.curso_id AND i.usuario_id = $2
      WHERE t.id = $1`,
    [tarjetaId, usuarioId],
  );
  if (!rows.length) throw noEncontrado();

  const actual = await pool.query(
    'SELECT caja FROM progreso_tarjetas WHERE usuario_id = $1 AND tarjeta_id = $2',
    [usuarioId, tarjetaId],
  );
  const cajaActual = actual.rows.length ? actual.rows[0].caja : 1;
  const destino = siguienteRevision(cajaActual, acerto, fecha);

  await pool.query(
    `INSERT INTO progreso_tarjetas (usuario_id, tarjeta_id, caja, proxima_revision)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (usuario_id, tarjeta_id)
     DO UPDATE SET caja = EXCLUDED.caja, proxima_revision = EXCLUDED.proxima_revision`,
    [usuarioId, tarjetaId, destino.caja, destino.proxima_revision],
  );

  // Historial para el reporte: así "tarjetas más falladas" son datos reales.
  await pool.query(
    'INSERT INTO respuestas_repaso (usuario_id, tarjeta_id, acerto) VALUES ($1, $2, $3)',
    [usuarioId, tarjetaId, acerto],
  );

  return destino;
}
