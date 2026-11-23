/** Equivalencias de idiomas de la app a códigos BCP-47 para speechSynthesis. */
export const IDIOMAS_AUDIO = {
  ruso: 'ru-RU',
  inglés: 'en-US',
  ingles: 'en-US',
  francés: 'fr-FR',
  frances: 'fr-FR',
  alemán: 'de-DE',
  aleman: 'de-DE',
  italiano: 'it-IT',
  español: 'es-ES',
  espanol: 'es-ES',
};

export function codigoIdioma(idioma) {
  if (!idioma) return 'ru-RU';
  const clave = String(idioma).trim().toLocaleLowerCase('es');
  if (IDIOMAS_AUDIO[clave]) return IDIOMAS_AUDIO[clave];
  if (/^[a-z]{2}(-[a-z]{2})?$/i.test(clave)) return clave;
  return 'ru-RU';
}

/** Devuelve una voz adecuada o null. Lista vacía => el navegador aún no ha cargado las voces. */
export function buscarVoz(idioma) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.speechSynthesis.getVoices) {
    return null;
  }
  const codigo = codigoIdioma(idioma);
  const prefijo = codigo.split('-')[0].toLowerCase();
  const voces = window.speechSynthesis.getVoices() || [];
  return voces.find((voz) => voz.lang && voz.lang.toLowerCase().replace('_', '-').startsWith(prefijo)) || null;
}

/**
 * Reproduce texto con la síntesis de voz del navegador.
 * Devuelve { ok, mensaje } para poder mostrar un aviso accesible si no hay voz.
 */
export function hablar(texto, { idioma = 'ru-RU', velocidad = 0.9 } = {}) {
  const codigo = codigoIdioma(idioma);
  if (!texto) {
    return { ok: false, mensaje: 'No hay texto para reproducir.' };
  }
  if (typeof window === 'undefined' || typeof window.SpeechSynthesisUtterance === 'undefined' || !window.speechSynthesis) {
    return { ok: false, mensaje: `Este navegador no puede leer en voz alta. Consulta la transcripción: ${texto}` };
  }

  const voces = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
  if (voces.length > 0 && !buscarVoz(codigo)) {
    return {
      ok: false,
      mensaje: `No hay voz instalada para ${codigo}. Puedes leer la transcripción: ${texto}`,
    };
  }

  try {
    window.speechSynthesis.cancel();
    const enunciado = new window.SpeechSynthesisUtterance(String(texto));
    enunciado.lang = codigo;
    enunciado.rate = velocidad;
    enunciado.pitch = 1;
    const voz = buscarVoz(codigo);
    if (voz) enunciado.voice = voz;
    window.speechSynthesis.speak(enunciado);
    return { ok: true, mensaje: `Reproduciendo: ${texto}` };
  } catch {
    return { ok: false, mensaje: `No se pudo reproducir el audio. Transcripción: ${texto}` };
  }
}

export function detenerAudio() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // El navegador no soporta cancelar la síntesis.
    }
  }
}

export const ABECEDARIO_RUSO = [
  { letra: 'А', nombre: 'a', ejemplo: 'мама', traduccion: 'mamá' },
  { letra: 'Б', nombre: 'be', ejemplo: 'брат', traduccion: 'hermano' },
  { letra: 'В', nombre: 've', ejemplo: 'вода', traduccion: 'agua' },
  { letra: 'Г', nombre: 'gue', ejemplo: 'город', traduccion: 'ciudad' },
  { letra: 'Д', nombre: 'de', ejemplo: 'да', traduccion: 'sí' },
  { letra: 'Е', nombre: 'ie', ejemplo: 'еда', traduccion: 'comida' },
  { letra: 'Ё', nombre: 'io', ejemplo: 'ёлка', traduccion: 'abeto' },
  { letra: 'Ж', nombre: 'je', ejemplo: 'живот', traduccion: 'animal' },
  { letra: 'З', nombre: 'ze', ejemplo: 'звук', traduccion: 'sonido' },
  { letra: 'И', nombre: 'i', ejemplo: 'имя', traduccion: 'nombre' },
  { letra: 'Й', nombre: 'i breve', ejemplo: 'йогурт', traduccion: 'yogur' },
  { letra: 'К', nombre: 'ka', ejemplo: 'книга', traduccion: 'libro' },
  { letra: 'Л', nombre: 'el', ejemplo: 'луна', traduccion: 'luna' },
  { letra: 'М', nombre: 'em', ejemplo: 'мир', traduccion: 'mundo / paz' },
  { letra: 'Н', nombre: 'en', ejemplo: 'нет', traduccion: 'no' },
  { letra: 'О', nombre: 'o', ejemplo: 'окно', traduccion: 'ventana' },
  { letra: 'П', nombre: 'pe', ejemplo: 'пять', traduccion: 'cinco' },
  { letra: 'Р', nombre: 'er', ejemplo: 'рука', traduccion: 'mano' },
  { letra: 'С', nombre: 'es', ejemplo: 'солнце', traduccion: 'sol' },
  { letra: 'Т', nombre: 'te', ejemplo: 'ты', traduccion: 'tú' },
  { letra: 'У', nombre: 'u', ejemplo: 'урок', traduccion: 'lección' },
  { letra: 'Ф', nombre: 'ef', ejemplo: 'фото', traduccion: 'foto' },
  { letra: 'Х', nombre: 'ja', ejemplo: 'хорошо', traduccion: 'bien' },
  { letra: 'Ц', nombre: 'tse', ejemplo: 'цена', traduccion: 'precio' },
  { letra: 'Ч', nombre: 'che', ejemplo: 'час', traduccion: 'hora' },
  { letra: 'Ш', nombre: 'sha', ejemplo: 'школа', traduccion: 'escuela' },
  { letra: 'Щ', nombre: 'scha', ejemplo: 'ящерица', traduccion: 'lagarto' },
  { letra: 'Ъ', nombre: 'signo duro', ejemplo: 'ъ', traduccion: 'signo duro' },
  { letra: 'Ы', nombre: 'y', ejemplo: 'мы', traduccion: 'nosotros' },
  { letra: 'Ь', nombre: 'signo blando', ejemplo: 'соль', traduccion: 'sal' },
  { letra: 'Э', nombre: 'e', ejemplo: 'это', traduccion: 'esto' },
  { letra: 'Ю', nombre: 'iu', ejemplo: 'юга', traduccion: 'sur' },
  { letra: 'Я', nombre: 'ia', ejemplo: 'я', traduccion: 'yo' },
];

export const FRASES_EJEMPLO = [
  { ruso: 'Здравствуйте!', transliteracion: 'Zdrastvuyte!', espanol: '¡Hola! (formal)' },
  { ruso: 'Как вас зовут?', transliteracion: 'Kak vas zovut?', espanol: '¿Cómo se llama?' },
  { ruso: 'Я учу русский язык.', transliteracion: 'Ya uchu russkiy yazyk.', espanol: 'Estudio ruso.' },
  { ruso: 'Сколько это стоит?', transliteracion: 'Skolko eto stoit?', espanol: '¿Cuánto cuesta?' },
  { ruso: 'Где находится вокзал?', transliteracion: 'Gde nakhoditsya vokzal?', espanol: '¿Dónde está la estación?' },
  { ruso: 'Спасибо большое!', transliteracion: 'Spasibo bolshoye!', espanol: '¡Muchas gracias!' },
];

export const TECLADO_CIRILICO = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', '.'],
];

export default {
  hablar,
  detenerAudio,
  IDIOMAS_AUDIO,
  codigoIdioma,
  buscarVoz,
  ABECEDARIO_RUSO,
  FRASES_EJEMPLO,
  TECLADO_CIRILICO,
};
