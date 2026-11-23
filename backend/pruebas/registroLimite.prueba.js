import { describe, test, expect, jest, beforeEach } from '@jest/globals';

process.env.DATABASE_URL = 'postgresql://prueba:prueba@localhost:5432/prueba';
process.env.JWT_SECRET = 'secreto-de-prueba-largo';

const query = jest.fn();
const connect = jest.fn();
jest.unstable_mockModule('../src/config/baseDatos.js', () => ({
  pool: { query, connect, end: jest.fn() },
}));

const { registrarAlumno } = await import('../src/servicios/autenticacion.servicio.js');
const { ErrorApi } = await import('../src/utilidades/errorApi.js');

beforeEach(() => {
  query.mockReset();
  connect.mockReset();
});

describe('registro de alumnos con límite del plan', () => {
  test('no inscribe si el maestro ya tiene 10 alumnos en el plan gratis', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 1, maestro_id: 1 }] }) // curso por código
      .mockResolvedValueOnce({ rows: [{ plan: 'gratis' }] }) // leerPlan
      .mockResolvedValueOnce({ rows: [{ total: 10 }] }); // contar alumnos

    await expect(registrarAlumno({
      nombre: 'Nuevo',
      email: 'nuevo@ejemplo.es',
      contrasena: '12345678',
      codigo_invitacion: 'RUSO123',
    })).rejects.toMatchObject({ status: 409, codigo: 'limite_plan' });

    expect(connect).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(3);
  });

  test('con código inválido ni siquiera consulta el plan', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const error = await registrarAlumno({
      nombre: 'Nuevo',
      email: 'nuevo@ejemplo.es',
      contrasena: '12345678',
      codigo_invitacion: 'NOVALIDO',
    }).catch((e) => e);

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.codigo).toBe('codigo_invalido');
    expect(query).toHaveBeenCalledTimes(1);
  });
});
