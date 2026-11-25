import { describe, test, expect } from '@jest/globals';
import { generarToken, hashToken } from '../src/utilidades/tokens.js';
import {
  registroAlumnoEsquema,
  registroMaestroEsquema,
  respuestaRepasoEsquema,
  resultadoQuizEsquema,
} from '../src/utilidades/esquemas.js';

describe('tokens de verificación', () => {
  test('el token es aleatorio y su hash es SHA-256 de 64 caracteres', () => {
    const primero = generarToken();
    const segundo = generarToken();

    expect(primero).not.toBe(segundo);
    expect(hashToken(primero)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(primero)).not.toBe(primero); // nunca se guarda el token en claro
  });

  test('el mismo token siempre produce el mismo hash', () => {
    const token = generarToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });
});

describe('validación de registros', () => {
  test('normaliza el email a minúsculas', () => {
    const datos = registroMaestroEsquema.parse({
      nombre: 'Ana',
      email: 'ANA@EJEMPLO.ES',
      contrasena: '12345678',
    });
    expect(datos.email).toBe('ana@ejemplo.es');
  });

  test('rechaza contraseña corta y código de invitación inválido', () => {
    expect(registroMaestroEsquema.safeParse({
      nombre: 'Ana', email: 'ana@ejemplo.es', contrasena: '123',
    }).success).toBe(false);

    expect(registroAlumnoEsquema.safeParse({
      nombre: 'Luis', email: 'luis@ejemplo.es', contrasena: '12345678', codigo_invitacion: 'ABC',
    }).success).toBe(false);
  });
});

describe('ids que llegan como texto', () => {
  test('acepta BIGINT de PostgreSQL y convierte el id a número', () => {
    expect(respuestaRepasoEsquema.parse({ tarjeta_id: '8', acerto: true })).toEqual({
      tarjeta_id: 8,
      acerto: true,
    });
    expect(resultadoQuizEsquema.parse({ leccion_id: '12', puntaje: 3, total: 4 })).toEqual({
      leccion_id: 12,
      puntaje: 3,
      total: 4,
    });
  });

  test('sigue rechazando ids que no son enteros positivos', () => {
    expect(respuestaRepasoEsquema.safeParse({ tarjeta_id: 'abc', acerto: true }).success).toBe(false);
    expect(respuestaRepasoEsquema.safeParse({ tarjeta_id: '0', acerto: true }).success).toBe(false);
    expect(resultadoQuizEsquema.safeParse({ leccion_id: '-1', puntaje: 0, total: 4 }).success).toBe(false);
  });
});
