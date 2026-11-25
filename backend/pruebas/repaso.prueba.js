import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const query = jest.fn();
const release = jest.fn();
const connect = jest.fn(() => ({ query, release }));
jest.unstable_mockModule('../src/config/baseDatos.js', () => ({ pool: { query, connect } }));

const { responder, repasoDeHoy, reiniciar } = await import('../src/servicios/repaso.servicio.js');
const { ErrorApi } = await import('../src/utilidades/errorApi.js');

beforeEach(() => {
  query.mockReset();
  release.mockReset();
  connect.mockClear();
});

describe('servicio de repaso', () => {
  test('usa la caja guardada y suma XP al subir de caja', async () => {
    query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 8, curso_id: 1 }] }) // tarjeta del alumno
      .mockResolvedValueOnce({ rows: [{ caja: 4 }] }) // progreso actual
      .mockResolvedValueOnce({ rowCount: 1 }) // UPSERT
      .mockResolvedValueOnce({ rows: [] }) // historial de respuesta
      .mockResolvedValueOnce({ rows: [{ xp: 100, racha: 6, ultima_actividad: '2026-06-14T12:00:00Z' }] })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE usuario
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const fecha = new Date('2026-06-15T12:00:00Z');
    const resultado = await responder(8, true, 3, fecha);

    expect(resultado).toEqual({
      caja: 5,
      proxima_revision: '2026-06-30',
      xp_ganado: 20, // 10 por acierto + 10 por llegar a racha 7
      xp_total: 120,
      racha: 7,
      nivel: 2,
      sin_xp: false,
    });
    expect(query.mock.calls[3][1]).toEqual([3, 8, 5, '2026-06-30']);
    expect(query.mock.calls[4][1]).toEqual([3, 8, true]);
    expect(query.mock.calls[6][1]).toEqual([120, 7, fecha, 3]);
    expect(release).toHaveBeenCalled();
  });

  test('una tarjeta de otro curso no se puede responder: 404', async () => {
    query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // tarjeta ajena

    await expect(responder(999, true, 3)).rejects.toBeInstanceOf(ErrorApi);
    expect(query).toHaveBeenCalledTimes(3); // SELECT + ROLLBACK
    expect(release).toHaveBeenCalled();
  });

  test('no da XP si la tarjeta ya está en la caja 5', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 8, curso_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ caja: 5 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const resultado = await responder(8, true, 3);

    expect(resultado.caja).toBe(5);
    expect(resultado.xp_ganado).toBe(0);
    expect(query).toHaveBeenCalledTimes(6); // no consulta ni actualiza usuarios
  });

  test('no da XP cuando falla: la tarjeta vuelve a la caja 1', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 8, curso_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ caja: 4 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const resultado = await responder(8, false, 3);

    expect(resultado.caja).toBe(1);
    expect(resultado.xp_ganado).toBe(0);
    expect(query).toHaveBeenCalledTimes(6);
  });

  test('una tarjeta reiniciada sube de caja pero NO da XP', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 8, curso_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ caja: 4, sin_xp: true }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const resultado = await responder(8, true, 3);

    expect(resultado.caja).toBe(5);
    expect(resultado.xp_ganado).toBe(0);
    expect(resultado.sin_xp).toBe(true);
    expect(query).toHaveBeenCalledTimes(6); // no consulta ni actualiza usuarios
  });

  test('repaso de hoy trae tarjetas sin progreso como pendientes', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 8, caja: 1, sin_xp: false }] });

    const tarjetas = await repasoDeHoy(1, 3);

    expect(tarjetas).toHaveLength(1);
    expect(tarjetas[0].sin_xp).toBe(false);
    expect(query.mock.calls[0][1]).toEqual([1, 3]);
  });

  test('reiniciar devuelve las tarjetas del curso a hoy y las marca sin XP', async () => {
    query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rowCount: 4 }) // UPSERT
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const resultado = await reiniciar(1, 3);

    expect(resultado).toEqual({ reiniciadas: 4 });
    const [consulta, parametros] = query.mock.calls[1];
    expect(consulta).toContain('sin_xp = true');
    expect(parametros).toEqual([3, 1]);
    expect(query.mock.calls[2][0]).toBe('COMMIT');
    expect(release).toHaveBeenCalled();
  });

  test('si falla el reinicio se hace rollback', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error('fallo de base de datos'))
      .mockResolvedValueOnce({ rows: [] });

    await expect(reiniciar(1, 3)).rejects.toThrow('fallo de base de datos');
    expect(query.mock.calls[2][0]).toBe('ROLLBACK');
    expect(release).toHaveBeenCalled();
  });
});
