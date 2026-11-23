import { describe, test, expect } from '@jest/globals';
import { generarPreguntas } from '../src/utilidades/quiz.js';
import { actualizarRacha, nivelPorXp } from '../src/utilidades/racha.js';

const tarjetas = [
  { id: 1, palabra: 'А', transliteracion: 'a', traduccion: 'A' },
  { id: 2, palabra: 'Б', transliteracion: 'b', traduccion: 'B' },
  { id: 3, palabra: 'В', transliteracion: 'v', traduccion: 'V' },
  { id: 4, palabra: 'Г', transliteracion: 'g', traduccion: 'G' },
  { id: 5, palabra: 'Д', transliteracion: 'd', traduccion: 'D' },
];

describe('generador de quiz', () => {
  test('crea los dos tipos de pregunta con 4 opciones', () => {
    const preguntas = generarPreguntas(tarjetas, 4, () => 0.42);

    expect(preguntas).toHaveLength(4);
    expect(new Set(preguntas.map((p) => p.tipo))).toEqual(new Set(['traduccion', 'palabra']));
    preguntas.forEach((pregunta) => {
      expect(pregunta.opciones).toHaveLength(4);
      expect(pregunta.opciones).toContain(pregunta.respuesta_correcta);
      expect(new Set(pregunta.opciones).size).toBe(4);
    });
  });

  test('con pocas tarjetas no inventa opciones', () => {
    expect(generarPreguntas([tarjetas[0]], 4)).toEqual([]);
  });
});

describe('racha y nivel', () => {
  const fecha = new Date('2026-06-15T12:00:00Z');

  test('el mismo día no cambia la racha', () => {
    expect(actualizarRacha('2026-06-15T08:00:00Z', 3, fecha))
      .toEqual({ racha: 3, ultima_actividad: '2026-06-15T08:00:00Z' });
  });

  test('un día seguido suma 1 y un hueco la reinicia', () => {
    expect(actualizarRacha('2026-06-14T23:00:00Z', 3, fecha).racha).toBe(4);
    expect(actualizarRacha('2026-06-10T12:00:00Z', 9, fecha).racha).toBe(1);
  });

  test('el nivel sube cada 100 XP', () => {
    expect(nivelPorXp(0)).toBe(1);
    expect(nivelPorXp(99)).toBe(1);
    expect(nivelPorXp(100)).toBe(2);
    expect(nivelPorXp(250)).toBe(3);
  });
});
