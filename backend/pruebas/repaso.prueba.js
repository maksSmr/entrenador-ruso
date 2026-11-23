import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const query = jest.fn();
jest.unstable_mockModule('../src/config/baseDatos.js', () => ({ pool: { query } }));

const { responder, repasoDeHoy } = await import('../src/servicios/repaso.servicio.js');
const { ErrorApi } = await import('../src/utilidades/errorApi.js');

beforeEach(() => query.mockReset());

describe('servicio de repaso', () => {
  test('usa la caja guardada, no siempre la 1', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 8, curso_id: 1 }] }) // tarjeta del alumno
      .mockResolvedValueOnce({ rows: [{ caja: 4 }] }) // progreso actual
      .mockResolvedValueOnce({ rowCount: 1 }) // UPSERT
      .mockResolvedValueOnce({ rows: [] }); // historial de respuesta

    const fecha = new Date('2026-06-15T12:00:00Z');
    const resultado = await responder(8, true, 3, fecha);

    expect(resultado).toEqual({ caja: 5, proxima_revision: '2026-06-30' });
    expect(query.mock.calls[2][1]).toEqual([3, 8, 5, '2026-06-30']);
    expect(query.mock.calls[3][1]).toEqual([3, 8, true]);
  });

  test('una tarjeta de otro curso no se puede responder: 404', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(responder(999, true, 3)).rejects.toBeInstanceOf(ErrorApi);
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('repaso de hoy trae tarjetas sin progreso como pendientes', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 8, caja: 1 }] });

    const tarjetas = await repasoDeHoy(1, 3);

    expect(tarjetas).toHaveLength(1);
    expect(query.mock.calls[0][1]).toEqual([1, 3]);
  });
});
