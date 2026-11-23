import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const query = jest.fn();
jest.unstable_mockModule('../src/config/baseDatos.js', () => ({ pool: { query } }));

const { reporteDetallado } = await import('../src/servicios/panel.servicio.js');

beforeEach(() => query.mockReset());

describe('reporte del maestro (Prompt 12c)', () => {
  test('devuelve repaso por lección, top de fallos e inactivos, siempre filtrado por maestro', async () => {
    query
      .mockResolvedValueOnce({
        rows: [{ id: 1, titulo: 'Alfabeto', alumnos_curso: 3, alumnos_que_repasaron: 2, porcentaje: '66.7' }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 8, palabra: 'привет', fallos: 4, respuestas: 6 }] })
      .mockResolvedValueOnce({ rows: [{ id: 4, nombre: 'Diego', ultima_actividad: null }] });

    const resultado = await reporteDetallado(1);

    expect(resultado.repaso_por_leccion[0].porcentaje).toBe(66.7);
    expect(resultado.tarjetas_mas_falladas[0].palabra).toBe('привет');
    expect(resultado.alumnos_inactivos[0].nombre).toBe('Diego');

    expect(query).toHaveBeenCalledTimes(3);
    query.mock.calls.forEach((llamada) => {
      expect(llamada[0]).toContain('c.maestro_id = $1');
      expect(llamada[1]).toEqual([1]);
    });
  });
});
