const TRANSLITERACION = {
  shch: 'щ',
  sch: 'щ',
  sh: 'ш',
  ch: 'ч',
  zh: 'ж',
  kh: 'х',
  ts: 'ц',
  yo: 'ё',
  yu: 'ю',
  ya: 'я',
  ye: 'е',
  ks: 'кс',
  a: 'а',
  b: 'б',
  c: 'ц',
  d: 'д',
  e: 'е',
  f: 'ф',
  g: 'г',
  h: 'х',
  i: 'и',
  j: 'й',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  q: 'к',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  v: 'в',
  w: 'в',
  x: 'кс',
  y: 'ы',
  z: 'з',
};

const FONETICO = {
  q: 'й',
  w: 'ц',
  e: 'у',
  r: 'к',
  t: 'е',
  y: 'н',
  u: 'г',
  i: 'ш',
  o: 'щ',
  p: 'з',
  '[': 'х',
  ']': 'ъ',
  a: 'ф',
  s: 'ы',
  d: 'в',
  f: 'а',
  g: 'п',
  h: 'р',
  j: 'о',
  k: 'л',
  l: 'д',
  ';': 'ж',
  "'": 'э',
  z: 'я',
  x: 'ч',
  c: 'с',
  v: 'м',
  b: 'и',
  n: 'т',
  m: 'ь',
  ',': 'б',
  '.': 'ю',
  '/': '.',
};

const VOCALES = 'аеёиоуыэяю';
const ACENTO = '\u0301';

function escapar(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function conservarMayusculas(original, resultado) {
  if (original.length > 1 && original === original.toUpperCase()) {
    return resultado.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return resultado[0].toUpperCase() + resultado.slice(1);
  }
  return resultado;
}

/**
 * Convierte texto escrito con teclado latino a cirílico.
 * esquema: 'transliteracion' (privet -> привет) o 'fonetico' (teclado ЙЦУКЕН).
 */
export function convertirTeclado(texto, esquema = 'transliteracion') {
  if (texto === null || texto === undefined) return '';
  const mapa = esquema === 'fonetico' ? FONETICO : TRANSLITERACION;
  const claves = Object.keys(mapa).sort((a, b) => b.length - a.length);
  const expresion = new RegExp(claves.map(escapar).join('|'), 'gi');

  return String(texto).replace(expresion, (coincidencia) => {
    const resultado = mapa[coincidencia.toLowerCase()];
    return resultado ? conservarMayusculas(coincidencia, resultado) : coincidencia;
  });
}

/** Coloca el acento tónico (1 = primera vocal) sobre la vocal indicada. */
export function marcarAcento(palabra, posicion) {
  if (!palabra) return '';
  const pos = Number(posicion);
  if (!Number.isInteger(pos) || pos < 1) return palabra;

  let contador = 0;
  return Array.from(palabra)
    .map((letra) => {
      const base = letra.toLowerCase();
      if (!VOCALES.includes(base)) return letra;
      contador += 1;
      if (contador !== pos || base === 'ё') return letra;
      return `${letra}${ACENTO}`;
    })
    .join('');
}

/** Devuelve el ordinal (1-based) de cada vocal: coincide con el parámetro de marcarAcento. */
export function posicionesVocales(palabra) {
  if (!palabra) return [];
  const posiciones = [];
  Array.from(palabra).forEach((letra) => {
    if (VOCALES.includes(letra.toLowerCase())) posiciones.push(posiciones.length + 1);
  });
  return posiciones;
}

/** Quita las marcas de acento combinante sin alterar la ё. */
export function quitarAcento(palabra) {
  return palabra ? String(palabra).replace(new RegExp(ACENTO, 'g'), '') : '';
}

function normalizarBase(texto) {
  return String(texto || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .replace(new RegExp(ACENTO, 'g'), '');
}

/**
 * Comparación tolerante de respuestas en ruso.
 * Ignora mayúsculas, la equivalencia ё/е y los espacios sobrantes.
 * Avisa cuando falta el acento tónico o una letra.
 * Devuelve { correcta, mensaje, motivo }.
 */
export function compararRespuesta(escrita, esperada) {
  const baseEscrita = normalizarBase(escrita);
  const baseEsperada = normalizarBase(esperada);

  if (!baseEscrita) {
    return { correcta: false, mensaje: 'Escribe una respuesta antes de comprobarla.', motivo: 'vacia' };
  }

  const esperaAcento = String(esperada || '').includes(ACENTO);
  const tieneAcento = String(escrita || '').includes(ACENTO);

  if (baseEscrita === baseEsperada) {
    if (esperaAcento && !tieneAcento) {
      return {
        correcta: false,
        mensaje: 'Casi: falta el acento tónico. Coloca la tilde sobre la vocal indicada.',
        motivo: 'acento',
      };
    }
    return { correcta: true, mensaje: '¡Correcto!', motivo: null };
  }

  if (esperaAcento && !tieneAcento && baseEscrita.length < baseEsperada.length) {
    return {
      correcta: false,
      mensaje: 'Falta una letra y el acento tónico. Revisa la palabra esperada.',
      motivo: 'letra_y_acento',
    };
  }

  return {
    correcta: false,
    mensaje: `Falta una letra o hay una letra distinta. La respuesta esperada es «${esperada}».`,
    motivo: 'letra',
  };
}

export const MAPA_TECLADO_LATINO = { ...TRANSLITERACION };
export const MAPA_TECLADO_FONETICO = { ...FONETICO };

export default {
  convertirTeclado,
  marcarAcento,
  posicionesVocales,
  quitarAcento,
  compararRespuesta,
};

