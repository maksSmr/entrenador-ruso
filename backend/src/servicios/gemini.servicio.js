import { entorno } from '../config/entorno.js';
import { ErrorApi } from '../utilidades/errorApi.js';

const MAX_SUGERENCIAS = 24;
const LIMITE_CAMPO = 500;

const INSTRUCCION = `Eres profesor de ruso. A partir del texto de un libro o apunte, propón tarjetas de vocabulario para alumnos hispanohablantes.
Reglas:
- Devuelve SOLO un objeto JSON con la forma {"tarjetas": [...]}.
- Cada tarjeta debe tener: palabra (cirílico), transliteracion (latino), traduccion (español), ejemplo_ruso (frase breve), ejemplo_traduccion (su traducción) y nota_gramatical (matiz, caso, aspecto o uso; textO breve).
- No inventes palabras que no aparezcan en el texto y no repitas la misma palabra.
- Máximo ${MAX_SUGERENCIAS} tarjetas, las más útiles primero.
- Si el texto no sirve para vocabulario, devuelve {"tarjetas": []}.`;

const recortar = (valor, max = LIMITE_CAMPO) =>
  String(valor ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

/** Convierte un elemento cualquiera en una sugerencia segura y alineada con el esquema de tarjetas. */
export function normalizarSugerencia(elemento) {
  if (!elemento || typeof elemento !== 'object') return null;

  const palabra = recortar(elemento.palabra, 200);
  const transliteracion = recortar(elemento.transliteracion, 200);
  const traduccion = recortar(elemento.traduccion, 500);
  if (!palabra || !transliteracion || !traduccion) return null;

  const acento = Number(elemento.acento_posicion);
  const acento_posicion = Number.isInteger(acento) && acento >= 0 && acento <= 199 ? acento : null;

  return {
    palabra,
    transliteracion,
    traduccion,
    ejemplo_ruso: recortar(elemento.ejemplo_ruso) || null,
    ejemplo_traduccion: recortar(elemento.ejemplo_traduccion) || null,
    nota_gramatical: recortar(elemento.nota_gramatical) || null,
    acento_posicion,
  };
}

/** Acepta JSON plano o envuelto en bloques ```json, y descarta sugerencias incompletas. */
export function parsearRespuesta(textoRespuesta) {
  let datos;
  try {
    const limpio = String(textoRespuesta ?? '')
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    datos = JSON.parse(limpio);
  } catch {
    throw new ErrorApi(502, 'Gemini devolvió una respuesta que no pudimos leer', 'gemini_respuesta_invalida');
  }

  const lista = Array.isArray(datos)
    ? datos
    : Array.isArray(datos?.tarjetas)
      ? datos.tarjetas
      : Array.isArray(datos?.sugerencias)
        ? datos.sugerencias
        : null;

  if (!lista) {
    throw new ErrorApi(502, 'Gemini no devolvió una lista de tarjetas', 'gemini_respuesta_invalida');
  }

  const vistas = new Set();
  const sugerencias = lista
    .map(normalizarSugerencia)
    .filter((sugerencia) => {
      if (!sugerencia) return false;
      const clave = sugerencia.palabra.toLocaleLowerCase();
      if (vistas.has(clave)) return false;
      vistas.add(clave);
      return true;
    })
    .slice(0, MAX_SUGERENCIAS);
  if (!sugerencias.length) {
    throw new ErrorApi(502, 'Gemini no propuso tarjetas completas. Prueba con otro documento.', 'gemini_respuesta_invalida');
  }
  return sugerencias;
}

/**
 * Llama a la API de Gemini. `fetchFn` se inyecta para poder probarlo sin red.
 * La clave viaja solo en el servidor: nunca se devuelve al frontend.
 */
export async function generarSugerencias(texto, { fetchFn = globalThis.fetch } = {}) {
  if (!entorno.geminiApiKey) {
    throw new ErrorApi(
      503,
      'La generación con IA no está configurada. Añade GEMINI_API_KEY al backend.',
      'gemini_sin_configuracion',
    );
  }

  const cuerpo = {
    systemInstruction: { parts: [{ text: INSTRUCCION }] },
    contents: [{ role: 'user', parts: [{ text: `Texto del documento:\n\n${texto}` }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          tarjetas: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                palabra: { type: 'STRING' },
                transliteracion: { type: 'STRING' },
                traduccion: { type: 'STRING' },
                ejemplo_ruso: { type: 'STRING' },
                ejemplo_traduccion: { type: 'STRING' },
                nota_gramatical: { type: 'STRING' },
                acento_posicion: { type: 'INTEGER' },
              },
              required: ['palabra', 'transliteracion', 'traduccion'],
            },
          },
        },
        required: ['tarjetas'],
      },
    },
  };

  const modelo = encodeURIComponent(entorno.geminiModelo || 'gemini-2.5-flash');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(entorno.geminiApiKey)}`;

  let respuesta;
  try {
    respuesta = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
  } catch (error) {
    throw new ErrorApi(502, 'No se pudo contactar con Gemini. Inténtalo de nuevo.', 'gemini_error');
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    // Se registra en el servidor para diagnosticar, sin filtrar la clave en la respuesta.
    console.error('Gemini respondió', respuesta.status, detalle.slice(0, 300));
    throw new ErrorApi(502, 'Gemini rechazó la solicitud. Revisa la clave de API.', 'gemini_error');
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new ErrorApi(502, 'Gemini devolvió una respuesta inesperada', 'gemini_respuesta_invalida');
  }

  const textoGenerado = (datos?.candidates?.[0]?.content?.parts ?? [])
    .map((parte) => parte?.text ?? '')
    .join('');
  return parsearRespuesta(textoGenerado);
}
