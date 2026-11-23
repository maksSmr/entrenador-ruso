import {
  compararRespuesta,
  convertirTeclado,
  marcarAcento,
  posicionesVocales,
} from '../utilidades/cirilico';

describe('utilidades de cirílico', () => {
  it('convierte teclado latino a cirílico (transliteración y esquema fonético)', () => {
    expect(convertirTeclado('privet')).toBe('привет');
    expect(convertirTeclado('Privet')).toBe('Привет');
    expect(convertirTeclado('spasibo')).toBe('спасибо');
    expect(convertirTeclado('g', 'fonetico')).toBe('п');
    expect(convertirTeclado('', 'fonetico')).toBe('');
  });

  it('marca el acento tónico con U+0301 sobre la vocal indicada', () => {
    expect(marcarAcento('привет', 2)).toBe('приве\u0301т');
    expect(marcarAcento('мама', 1)).toBe('ма\u0301ма');
    expect(marcarAcento('привет', 9)).toBe('привет');
    expect(posicionesVocales('привет')).toEqual([1, 2]);
  });

  it('compararRespuesta ignora mayúsculas, ё/е y espacios sobrantes', () => {
    expect(compararRespuesta('Привет ', ' привет ').correcta).toBe(true);
    expect(compararRespuesta('ёлка', 'елка').correcta).toBe(true);
    expect(compararRespuesta('', 'мама').correcta).toBe(false);
  });

  it('compararRespuesta avisa si falta el acento o una letra', () => {
    const sinAcento = compararRespuesta('привет', 'приве\u0301т');
    expect(sinAcento.correcta).toBe(false);
    expect(sinAcento.motivo).toBe('acento');
    expect(sinAcento.mensaje).toMatch(/acento/i);

    const conAcento = compararRespuesta('приве\u0301т', 'приве\u0301т');
    expect(conAcento.correcta).toBe(true);

    const sinLetra = compararRespuesta('приве', 'привет');
    expect(sinLetra.correcta).toBe(false);
    expect(sinLetra.mensaje).toMatch(/letra/i);
  });
});
