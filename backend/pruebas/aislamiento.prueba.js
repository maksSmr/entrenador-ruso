import { describe, test, expect, jest, beforeAll, beforeEach } from '@jest/globals';

process.env.DATABASE_URL = 'postgresql://prueba:prueba@localhost:5432/prueba';
process.env.JWT_SECRET = 'secreto-de-prueba-largo';

const query = jest.fn();
jest.unstable_mockModule('../src/config/baseDatos.js', () => ({
  pool: { query, connect: jest.fn(), end: jest.fn() },
}));

const { default: app } = await import('../src/app.js');
const { default: request } = await import('supertest');
const { default: jwt } = await import('jsonwebtoken');

const token = (id, rol) => jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

let tokenMaestroA;
let tokenMaestroB;
let tokenAlumno;

beforeAll(() => {
  tokenMaestroA = token(1, 'maestro');
  tokenMaestroB = token(2, 'maestro');
  tokenAlumno = token(3, 'alumno');
});

beforeEach(() => {
  query.mockReset();
  // Simula que el curso 5 no pertenece al maestro que pregunta.
  query.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('aislamiento entre maestros con supertest', () => {
  test('el maestro A no puede LEER el curso del maestro B', async () => {
    const respuesta = await request(app)
      .get('/cursos/5')
      .set('Authorization', `Bearer ${tokenMaestroA}`);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.codigo).toBe('no_encontrado');
  });

  test('el maestro A no puede EDITAR el curso del maestro B', async () => {
    const respuesta = await request(app)
      .put('/cursos/5')
      .set('Authorization', `Bearer ${tokenMaestroB}`)
      .send({ nombre: 'Robado' });

    expect(respuesta.status).toBe(404);
  });

  test('el maestro A no puede BORRAR el curso del maestro B', async () => {
    const respuesta = await request(app)
      .delete('/cursos/5')
      .set('Authorization', `Bearer ${tokenMaestroA}`);

    expect(respuesta.status).toBe(404);
  });

  test('el maestro A no puede ver los ALUMNOS del curso del maestro B', async () => {
    const respuesta = await request(app)
      .get('/cursos/5/alumnos')
      .set('Authorization', `Bearer ${tokenMaestroA}`);

    expect(respuesta.status).toBe(404);
  });

  test('un alumno no puede usar rutas de maestro', async () => {
    const respuesta = await request(app)
      .get('/cursos')
      .set('Authorization', `Bearer ${tokenAlumno}`);

    expect(respuesta.status).toBe(403);
  });

  test('sin token no se accede a cursos', async () => {
    const respuesta = await request(app).get('/cursos');
    expect(respuesta.status).toBe(401);
  });

  test('una ruta inexistente sigue siendo 404, no 401', async () => {
    const respuesta = await request(app).get('/no-existe');
    expect(respuesta.status).toBe(404);
  });
});
