import { pool } from '../config/baseDatos.js';
import { parsearCsv } from '../utilidades/csv.js';
import { ErrorApi } from '../utilidades/errorApi.js';

// Inserta todo o nada: si falla una fila, se revierte la transacción.
export async function importarCsv(leccionId, contenido, maestroId) {
  const { filasValidas, razones } = parsearCsv(contenido);

  const cliente = await pool.connect();
  let importadas = 0;
  let existentes = 0;

  try {
    await cliente.query('BEGIN');

    const leccion = await cliente.query(
      `SELECT 1 FROM lecciones l JOIN cursos c ON c.id = l.curso_id
        WHERE l.id = $1 AND c.maestro_id = $2`,
      [leccionId, maestroId],
    );
    if (!leccion.rowCount) {
      throw new ErrorApi(404, 'Lección no encontrada', 'no_encontrado');
    }

    for (const fila of filasValidas) {
      const resultado = await cliente.query(
        `INSERT INTO tarjetas
           (leccion_id, palabra, transliteracion, traduccion,
            acento_posicion, ejemplo_ruso, ejemplo_traduccion, audio_url)
         SELECT $1, $2, $3, $4, $5, $6, $7, $8
           FROM lecciones l JOIN cursos c ON c.id = l.curso_id
          WHERE l.id = $1 AND c.maestro_id = $9
         ON CONFLICT (leccion_id, palabra) DO NOTHING`,
        [leccionId, fila.palabra, fila.transliteracion, fila.traduccion,
          fila.acento_posicion ?? null, fila.ejemplo_ruso ?? null,
          fila.ejemplo_traduccion ?? null, fila.audio_url ?? null, maestroId],
      );
      if (resultado.rowCount) importadas += 1;
      else existentes += 1;
    }

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  return {
    leccion_id: leccionId,
    importadas,
    omitidas: filasValidas.length - importadas + razones.filas_vacias
      + razones.duplicadas_en_archivo,
    razones: { ...razones, ya_existentes: existentes },
  };
}
