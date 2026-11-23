import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const query = jest.fn();
const release = jest.fn();
const connect = jest.fn(() => ({ query, release }));
jest.unstable_mockModule('../src/config/baseDatos.js', () => ({ pool: { query, connect } }));

const { guardarResultado } = await import('../src/servicios/quiz.servicio.js');
const { ErrorApi } = await import('../src/utilidades/errorApi.js');

beforeEach(() => {
  query.mockReset();
  release.mockReset();
  connect.mockClear();
});

describe('guardar resultado del quiz', () => {
  test('suma XP, bonus por perfecto y bonus por racha de 7', async () => {
    query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // lección del alumno
      .mockResolvedValueOnce({ rows: [{ xp: 100, racha: 6, ultima_actividad: '2026-06-14T12:00:00Z' }] })
      .mockResolvedValueOnce({ rows: [] }) // insert resultado
      .mockResolvedValueOnce({ rows: [] }) // update usuario
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const resultado = await guardarResultado(
      { leccion_id: 1, puntaje: 4, total: 4 },
      3,
      new Date('2026-06-15T12:00:00Z'),
    );

    expect(resultado).toMatchObject({
      xp_ganado: 70,
      xp_total: 170,
      racha: 7,
      nivel: 2,
    });
    expect(resultado.desglose).toEqual({ xpBase: 40, bonusPerfecto: 20, bonusRacha: 10 });
    expect(release).toHaveBeenCalled();
  });

  test('rechaza puntaje mayor que el total', async () => {
    await expect(guardarResultado({ leccion_id: 1, puntaje: 9, total: 4 }, 3))
      .rejects.toBeInstanceOf(ErrorApi);
    expect(connect).not.toHaveBeenCalled();
  });
});
