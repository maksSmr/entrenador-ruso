import { describe, test, expect } from '@jest/globals';
import { parsearCsv, MAX_FILAS_CSV } from '../src/utilidades/csv.js';

describe('importación CSV', () => {
  test('acepta BOM, cabeceras con acentos y cirílico', () => {
    const csv = '\uFEFFpalabra,Transliteración,traducción,acento_posicion,ejemplo_ruso\r\n'
      + 'привет,privet,hola,4,"Привет, Анна!"\r\n'
      + 'спасибо,spasibo,gracias,2,"Спасибо, друг!"\r\n';

    const { filasValidas, razones } = parsearCsv(csv);

    expect(filasValidas).toHaveLength(2);
    expect(filasValidas[0]).toMatchObject({
      palabra: 'привет',
      transliteracion: 'privet',
      traduccion: 'hola',
      acento_posicion: 4,
      ejemplo_ruso: 'Привет, Анна!',
    });
    expect(razones).toEqual({
      filas_vacias: 0,
      duplicadas_en_archivo: 0,
      filas_invalidas: [],
    });
  });

  test('cuenta filas vacías y omite duplicados dentro del archivo', () => {
    const csv = 'palabra,transliteracion,traduccion\n'
      + 'А,a,A\n'
      + '\n'
      + 'А,a,A\n'
      + 'Б,b,B\n';

    const { filasValidas, razones } = parsearCsv(csv);

    expect(filasValidas.map((f) => f.palabra)).toEqual(['А', 'Б']);
    expect(razones.filas_vacias).toBe(1);
    expect(razones.duplicadas_en_archivo).toBe(1);
  });

  test('rechaza más de 500 filas', () => {
    const filas = Array.from(
      { length: MAX_FILAS_CSV + 1 },
      (_, i) => `p${i},t${i},tr${i}`,
    );
    const csv = `palabra,transliteracion,traduccion\n${filas.join('\n')}`;

    expect(() => parsearCsv(csv)).toThrow(/500/);
  });

  test('explica qué columnas faltan', () => {
    expect(() => parsearCsv('palabra,traduccion\nА,A\n'))
      .toThrow(/transliteracion/);
  });

  test('señala el número de fila inválida', () => {
    const csv = 'palabra,transliteracion,traduccion\nА,a,A\n,b,B\n';

    expect(() => parsearCsv(csv)).toThrow(/filas inválidas/i);
    try {
      parsearCsv(csv);
    } catch (error) {
      expect(error.detalles.filas_invalidas[0].fila).toBe(3);
    }
  });

  test('rechaza un archivo vacío', () => {
    expect(() => parsearCsv('')).toThrow(/vacío/i);
  });
});
