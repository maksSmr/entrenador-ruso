import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

process.env.DATABASE_URL = 'postgresql://prueba:prueba@localhost:5432/prueba';
process.env.JWT_SECRET = 'secreto-de-prueba-largo';
process.env.NODE_ENV = 'development';

const query = jest.fn();
const connect = jest.fn();
const enviarVerificacion = jest.fn();
const enviarRestablecimiento = jest.fn();

jest.unstable_mockModule('../src/config/baseDatos.js', () => ({
  pool: { query, connect, end: jest.fn() },
}));

jest.unstable_mockModule('../src/servicios/correo.js', () => ({
  enviarVerificacion,
  enviarRestablecimiento,
}));

const { registrarMaestro, iniciarSesion, reenviarVerificacion } = await import('../src/servicios/autenticacion.servicio.js');
const { verificarToken } = await import('../src/middlewares/verificarToken.js');

beforeEach(() => {
  query.mockReset();
  connect.mockReset();
  enviarVerificacion.mockReset();
  enviarRestablecimiento.mockReset();
});

describe('registro y acceso sin verificación de correo', () => {
  test('el alta crea la cuenta verificada y devuelve JWT listo para usar', async () => {
    const consultasCliente = jest.fn().mockImplementation((sql) => {
      if (sql.includes('INSERT INTO usuarios')) {
        return Promise.resolve({
          rows: [{
            id: 7,
            nombre: 'Nueva',
            email: 'nueva@ejemplo.es',
            rol: 'maestro',
            email_verificado: true,
          }],
        });
      }
      return Promise.resolve({ rows: [] });
    });
    connect.mockResolvedValue({
      query: consultasCliente,
      release: jest.fn(),
    });

    const respuesta = await registrarMaestro({
      nombre: 'Nueva',
      email: 'nueva@ejemplo.es',
      contrasena: '12345678',
    });

    expect(respuesta.token).toEqual(expect.any(String));
    expect(respuesta.usuario).toMatchObject({
      id: 7,
      email: 'nueva@ejemplo.es',
      rol: 'maestro',
      email_verificado: true,
    });
    const insercion = consultasCliente.mock.calls.find(([sql]) => sql.includes('INSERT INTO usuarios'))[0];
    expect(insercion).toContain('email_verificado');
    expect(insercion).toContain('true');
    expect(enviarVerificacion).not.toHaveBeenCalled();
    expect(jwt.verify(respuesta.token, process.env.JWT_SECRET)).toMatchObject({ id: 7, rol: 'maestro' });
  });

  test('el login no bloquea a una cuenta que siga marcada como no verificada en BD', async () => {
    const contrasenaHash = await bcrypt.hash('12345678', 4);
    query.mockResolvedValueOnce({
      rows: [{
        id: 9,
        nombre: 'Antigua',
        email: 'antigua@ejemplo.es',
        rol: 'alumno',
        contrasena_hash: contrasenaHash,
        email_verificado: false,
      }],
    });

    const respuesta = await iniciarSesion('antigua@ejemplo.es', '12345678');

    expect(respuesta.token).toEqual(expect.any(String));
    expect(respuesta.usuario).toMatchObject({ id: 9, rol: 'alumno', email_verificado: true });
  });

  test('el middleware solo valida la sesión aunque el token traiga email_verificado en falso', () => {
    const token = jwt.sign(
      { id: 9, rol: 'alumno', email_verificado: false },
      process.env.JWT_SECRET,
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();

    verificarToken(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.usuario).toEqual({ id: 9, rol: 'alumno' });
  });

  test('reenviar-verificacion ya no consulta la BD ni envía correos', async () => {
    const respuesta = await reenviarVerificacion('otro@ejemplo.es');

    expect(respuesta.mensaje).toEqual(expect.any(String));
    expect(query).not.toHaveBeenCalled();
    expect(enviarVerificacion).not.toHaveBeenCalled();
    expect(enviarRestablecimiento).not.toHaveBeenCalled();
  });
});
