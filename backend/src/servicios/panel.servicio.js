import { pool } from '../config/baseDatos.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import { nivelPorXp } from '../utilidades/racha.js';

export async function panelAlumno(usuarioId) {
  const { rows } = await pool.query(
    'SELECT xp, racha, ultima_actividad FROM usuarios WHERE id = $1',
    [usuarioId],
  );
  if (!rows.length) throw new ErrorApi(404, 'Usuario no encontrado', 'no_encontrado');

  const consultas = await Promise.all([
    pool.query('SELECT COUNT(*)::integer AS total FROM inscripciones WHERE usuario_id = $1', [usuarioId]),
    pool.query(
      `SELECT COUNT(*)::integer AS total, COALESCE(AVG(r.puntaje::float / r.total_preguntas), 0) AS promedio
         FROM resultados_quiz r WHERE r.usuario_id = $1`,
      [usuarioId],
    ),
    pool.query(
      `SELECT COUNT(*)::integer AS total
         FROM progreso_tarjetas p
         JOIN tarjetas t ON t.id = p.tarjeta_id
         JOIN lecciones l ON l.id = t.leccion_id
         JOIN inscripciones i ON i.curso_id = l.curso_id AND i.usuario_id = p.usuario_id
        WHERE p.usuario_id = $1 AND p.proxima_revision <= CURRENT_DATE`,
      [usuarioId],
    ),
  ]);

  const xp = rows[0].xp;
  return {
    xp,
    racha: rows[0].racha,
    nivel: nivelPorXp(xp),
    ultima_actividad: rows[0].ultima_actividad,
    cursos: consultas[0].rows[0].total,
    quizzes: consultas[1].rows[0].total,
    promedio_aciertos: Number(consultas[1].rows[0].promedio),
    tarjetas_pendientes: consultas[2].rows[0].total,
  };
}

export async function panelMaestro(maestroId) {
  const consultas = await Promise.all([
    pool.query('SELECT COUNT(*)::integer AS total FROM cursos WHERE maestro_id = $1', [maestroId]),
    pool.query(
      `SELECT COUNT(DISTINCT i.usuario_id)::integer AS total
         FROM inscripciones i JOIN cursos c ON c.id = i.curso_id
        WHERE c.maestro_id = $1`,
      [maestroId],
    ),
    pool.query(
      `SELECT COUNT(*)::integer AS total FROM lecciones l
         JOIN cursos c ON c.id = l.curso_id WHERE c.maestro_id = $1`,
      [maestroId],
    ),
    pool.query(
      `SELECT COUNT(*)::integer AS total FROM tarjetas t
         JOIN lecciones l ON l.id = t.leccion_id
         JOIN cursos c ON c.id = l.curso_id WHERE c.maestro_id = $1`,
      [maestroId],
    ),
  ]);

  return {
    cursos: consultas[0].rows[0].total,
    alumnos: consultas[1].rows[0].total,
    lecciones: consultas[2].rows[0].total,
    tarjetas: consultas[3].rows[0].total,
  };
}

// Reporte de la Prompt 12c: rendimiento por unidad del libro.
export async function reportePorUnidad(maestroId) {
  const { rows } = await pool.query(
    `SELECT l.unidad_libro, l.titulo AS leccion, COUNT(r.id)::integer AS intentos,
            COALESCE(AVG(r.puntaje::float / r.total_preguntas), 0) AS promedio
       FROM lecciones l
       JOIN cursos c ON c.id = l.curso_id AND c.maestro_id = $1
       LEFT JOIN resultados_quiz r ON r.leccion_id = l.id
      GROUP BY l.id, l.unidad_libro, l.titulo
      ORDER BY l.unidad_libro NULLS LAST, l.orden`,
    [maestroId],
  );
  return rows.map((fila) => ({ ...fila, promedio: Number(fila.promedio) }));
}

// Reporte completo de la Prompt 12c para preparar la siguiente clase por Zoom.
export async function reporteDetallado(maestroId) {
  const [repaso, falladas, inactivos] = await Promise.all([
    pool.query(
      `SELECT l.id, l.titulo, l.unidad_libro,
              COUNT(DISTINCT i.usuario_id)::integer AS alumnos_curso,
              COUNT(DISTINCT p.usuario_id)::integer AS alumnos_que_repasaron,
              ROUND(100.0 * COUNT(DISTINCT p.usuario_id)
                    / NULLIF(COUNT(DISTINCT i.usuario_id), 0), 1) AS porcentaje
         FROM lecciones l
         JOIN cursos c ON c.id = l.curso_id AND c.maestro_id = $1
         LEFT JOIN inscripciones i ON i.curso_id = l.curso_id
         LEFT JOIN tarjetas t ON t.leccion_id = l.id
         LEFT JOIN progreso_tarjetas p
                ON p.tarjeta_id = t.id AND p.usuario_id = i.usuario_id
        GROUP BY l.id, l.titulo, l.unidad_libro, l.orden
        ORDER BY l.unidad_libro NULLS LAST, l.orden`,
      [maestroId],
    ),
    pool.query(
      `SELECT t.id, t.palabra, t.traduccion, l.titulo AS leccion,
              COUNT(*) FILTER (WHERE r.acerto = false)::integer AS fallos,
              COUNT(*)::integer AS respuestas
         FROM respuestas_repaso r
         JOIN tarjetas t ON t.id = r.tarjeta_id
         JOIN lecciones l ON l.id = t.leccion_id
         JOIN cursos c ON c.id = l.curso_id AND c.maestro_id = $1
        GROUP BY t.id, l.titulo
        ORDER BY fallos DESC, respuestas DESC
        LIMIT 10`,
      [maestroId],
    ),
    pool.query(
      `SELECT u.id, u.nombre, u.email, u.ultima_actividad
         FROM usuarios u
         JOIN inscripciones i ON i.usuario_id = u.id
         JOIN cursos c ON c.id = i.curso_id AND c.maestro_id = $1
        WHERE u.rol = 'alumno'
          AND (u.ultima_actividad IS NULL OR u.ultima_actividad < NOW() - INTERVAL '7 days')
        GROUP BY u.id
        ORDER BY u.ultima_actividad NULLS FIRST`,
      [maestroId],
    ),
  ]);

  return {
    repaso_por_leccion: repaso.rows.map((fila) => ({
      ...fila,
      porcentaje: Number(fila.porcentaje ?? 0),
    })),
    tarjetas_mas_falladas: falladas.rows,
    alumnos_inactivos: inactivos.rows,
  };
}
