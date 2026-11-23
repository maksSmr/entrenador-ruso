import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const query = jest.fn();
jest.unstable_mockModule('../src/config/baseDatos.js', () => ({ pool: { query } }));

const { verificarLimite } = await import('../src/middlewares/verificarLimite.js');
const { miPlan } = await import('../src/servicios/planes.servicio.js');

beforeEach(() => query.mockReset());

describe('límites del plan', () => {
  test('el plan gratis permite un curso más pero bloquea el tercero', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ plan: 'gratis' }] }) // leerPlan
      .mockResolvedValueOnce({ rows: [{ total: 2 }] }); // contarRecurso

    const req = { usuario: { id: 1, rol: 'maestro' }, body: {} };
    const error = await new Promise((resolve) => verificarLimite('curso')(req, {}, resolve));
    expect(error.status).toBe(409);
    expect(error.codigo).toBe('limite_plan');
    expect(error.detalles).toMatchObject({ limite: 2, usados: 2 });

    query
      .mockResolvedValueOnce({ rows: [{ plan: 'gratis' }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] });

    const req2 = { usuario: { id: 1, rol: 'maestro' }, body: {} };
    const next = jest.fn();
    await verificarLimite('curso')(req2, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('el plan pro no limita cursos', async () => {
    query.mockResolvedValueOnce({ rows: [{ plan: 'pro' }] });

    const next = jest.fn();
    await verificarLimite('curso')({ usuario: { id: 2, rol: 'maestro' }, body: {} }, {}, next);

    expect(query).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  test('el límite de alumnos se aplica al maestro dueño del código', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ maestro_id: 7 }] }) // maestroDelCodigo
      .mockResolvedValueOnce({ rows: [{ plan: 'gratis' }] })
      .mockResolvedValueOnce({ rows: [{ total: 10 }] });

    const req = {
      usuario: { id: 3, rol: 'alumno' },
      body: { codigo_invitacion: 'RUSO123' },
    };
    const error = await new Promise((resolve) => verificarLimite('alumno')(req, {}, resolve));

    expect(error.status).toBe(409);
    expect(query.mock.calls[0][1]).toEqual(['RUSO123']);
  });

  test('un código inválido pasa y el servicio da el error concreto', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const next = jest.fn();
    await verificarLimite('alumno')({
      usuario: { id: 3, rol: 'alumno' },
      body: { codigo_invitacion: 'NOEXISTE' },
    }, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('/mi-plan devuelve plan, límites y uso', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ plan: 'pro' }] })
      .mockResolvedValueOnce({ rows: [{ total: 3 }] })
      .mockResolvedValueOnce({ rows: [{ total: 12 }] });

    const resultado = await miPlan({ id: 2, rol: 'maestro' });

    expect(resultado).toEqual({
      plan: 'pro',
      nombre: 'Pro',
      limites: { cursos: null, alumnos: 50 },
      uso: { cursos: 3, alumnos: 12 },
    });
  });
});
