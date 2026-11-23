import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const query = jest.fn();
jest.unstable_mockModule('../src/config/baseDatos.js', () => ({ pool: { query } }));

const {
  cursoDelMaestro,
  accesoCurso,
  leccionDelMaestro,
  accesoLeccion,
} = await import('../src/middlewares/pertenencia.js');

beforeEach(() => query.mockReset());

const crearReq = (rol) => ({
  usuario: { id: 1, rol },
  idCurso: 5,
  idLeccion: 9,
});

describe('middleware de pertenencia', () => {
  test('un maestro NO ve el curso de otro maestro: 404, nunca 403', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const next = jest.fn();

    await cursoDelMaestro(crearReq('maestro'), {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(404);
  });

  test('el maestro dueño sí pasa', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 5 }] });
    const next = jest.fn();

    await cursoDelMaestro(crearReq('maestro'), {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('un alumno no inscrito no accede al curso: 404', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const next = jest.fn();

    await accesoCurso(crearReq('alumno'), {}, next);

    expect(next.mock.calls[0][0].status).toBe(404);
  });

  test('una lección de otro curso no pasa el filtro de maestro', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const next = jest.fn();

    await leccionDelMaestro(crearReq('maestro'), {}, next);

    expect(next.mock.calls[0][0].status).toBe(404);
  });

  test('un alumno no ve lecciones borrador ni de cursos ajenos', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const next = jest.fn();

    await accesoLeccion(crearReq('alumno'), {}, next);

    expect(next.mock.calls[0][0].status).toBe(404);
  });
});
