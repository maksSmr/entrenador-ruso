import { describe, test, expect } from '@jest/globals';
import { siguienteRevision, fechaHoyZona } from '../src/utilidades/leitner.js';

describe('repaso espaciado (Leitner)', () => {
  test('hoy se calcula en America/Mexico_City', () => {
    // 02:30 UTC del 1 de enero => aún es 31 de diciembre (20:30) en CDMX.
    expect(fechaHoyZona(new Date('2026-01-01T02:30:00Z'))).toBe('2025-12-31');
  });

  test('acertar sube de caja y aplica el intervalo de esa caja', () => {
    const fecha = new Date('2026-06-15T12:00:00Z');
    expect(siguienteRevision(1, true, fecha)).toEqual({
      caja: 2,
      proxima_revision: '2026-06-17', // 2 días
    });
    expect(siguienteRevision(3, true, fecha)).toEqual({
      caja: 4,
      proxima_revision: '2026-06-22', // 7 días
    });
  });

  test('fallar vuelve a la caja 1 (mañana)', () => {
    const fecha = new Date('2026-06-15T12:00:00Z');
    expect(siguienteRevision(5, false, fecha)).toEqual({
      caja: 1,
      proxima_revision: '2026-06-16',
    });
  });

  test('la caja 5 nunca se pasa y espera 15 días', () => {
    const fecha = new Date('2026-06-15T12:00:00Z');
    expect(siguienteRevision(5, true, fecha)).toEqual({
      caja: 5,
      proxima_revision: '2026-06-30',
    });
  });

  test('cruza correctamente de mes y de año', () => {
    expect(siguienteRevision(1, true, new Date('2026-01-31T12:00:00Z')))
      .toEqual({ caja: 2, proxima_revision: '2026-02-02' });
    expect(siguienteRevision(5, true, new Date('2025-12-31T12:00:00Z')))
      .toEqual({ caja: 5, proxima_revision: '2026-01-15' });
  });
});
