import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const query = jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 }));
jest.unstable_mockModule('../src/config/baseDatos.js', () => ({ pool: { query } }));

const lecciones = await import('../src/servicios/lecciones.servicio.js');
const tarjetas = await import('../src/servicios/tarjetas.servicio.js');
const quiz = await import('../src/servicios/quiz.servicio.js');

beforeEach(() => {
  query.mockReset();
  query.mockImplementation(() => Promise.resolve({ rows: [], rowCount: 0 }));
});

describe('toda consulta SQL filtra por dueño', () => {
  test('lecciones de maestro filtran por c.maestro_id', async () => {
    await lecciones.listarPorCurso(1, { id: 7, rol: 'maestro' });
    expect(query.mock.calls[0][0]).toContain('c.maestro_id = $2');
    expect(query.mock.calls[0][1]).toEqual([1, 7]);
  });

  test('lecciones de alumno exigen inscripción y publicación', async () => {
    await lecciones.listarPorCurso(1, { id: 3, rol: 'alumno' });
    const sql = query.mock.calls[0][0];
    expect(sql).toContain('i.usuario_id = $2');
    expect(sql).toContain('l.publicada = true');
  });

  test('crear lección y tarjeta comprueban el dueño del curso', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });
    await lecciones.crear(1, 7, {
      titulo: 'Uno', descripcion: '', orden: 0, publicada: false,
      unidad_libro: null, fecha_asignada: null,
    });
    expect(query.mock.calls[0][0]).toContain('maestro_id = $8');

    query.mockReset();
    query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // no duplicado
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }); // insert
    await tarjetas.crear(1, 7, {
      palabra: 'а', transliteracion: 'a', traduccion: 'a',
    });
    expect(query.mock.calls[0][0]).toContain('c.maestro_id = $3');
    expect(query.mock.calls[1][0]).toContain('c.maestro_id = $10');
  });

  test('tarjetas y quiz del alumno pasan por inscripción', async () => {
    await tarjetas.listarPorLeccion(1, { id: 3, rol: 'alumno' });
    expect(query.mock.calls[0][0]).toContain('i.usuario_id = $2');

    query.mockClear();
    await quiz.generarQuiz(1, 4, { id: 3, rol: 'alumno' });
    expect(query.mock.calls[0][0]).toContain('i.usuario_id = $2');
  });
});
