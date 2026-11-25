/**
 * Diagnóstico: lista los modelos disponibles para la GEMINI_API_KEY configurada.
 * Uso (desde backend): node scripts/listarModelosGemini.js
 * No necesita DATABASE_URL: solo lee .env y llama a la API de Gemini.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GEMINI_MODELO_POR_DEFECTO } from '../src/config/gemini.js';

const raizBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(raizBackend, '.env') });

const apiKey = process.env.GEMINI_API_KEY ?? '';
const modeloConfigurado = process.env.GEMINI_MODELO || GEMINI_MODELO_POR_DEFECTO;

function ocultarClave(texto) {
  const seguro = String(texto ?? '');
  return apiKey ? seguro.replaceAll(apiKey, '[REDACTED]') : seguro;
}

function metodosDe(modelo) {
  // ListModels de Vertex/Gemini usa `supportedGenerationMethods`; se admiten variantes por robustez.
  if (Array.isArray(modelo?.supportedGenerationMethods)) return modelo.supportedGenerationMethods;
  if (Array.isArray(modelo?.methods)) return modelo.methods;
  if (Array.isArray(modelo?.supportedActions)) return modelo.supportedActions;
  if (modelo?.supportedActions && typeof modelo.supportedActions === 'object') {
    return Object.keys(modelo.supportedActions);
  }
  return [];
}

async function listarModelos() {
  const modelos = [];
  let pageToken = '';

  do {
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    let respuesta;
    try {
      respuesta = await fetch(url);
    } catch {
      throw new Error('No se pudo contactar con Gemini. Revisa la conexión a internet.');
    }

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => '');
      const sufijo = detalle ? `: ${ocultarClave(detalle).slice(0, 200)}` : '';
      throw new Error(`Gemini devolvió HTTP ${respuesta.status}${sufijo}`);
    }

    let datos;
    try {
      datos = await respuesta.json();
    } catch {
      throw new Error('Gemini devolvió una respuesta que no pudimos leer.');
    }

    if (Array.isArray(datos?.models)) modelos.push(...datos.models);
    pageToken = datos?.nextPageToken ?? '';
  } while (pageToken);

  return modelos;
}

function mostrarModelos(modelos) {
  if (!modelos.length) {
    console.log('La clave no devolvió modelos. Comprueba que la API de Generative Language esté habilitada.');
    return;
  }

  console.log(`Modelos disponibles para esta clave (${modelos.length}):`);
  for (const modelo of modelos) {
    const nombre = modelo.name || modelo.displayName || '(sin nombre)';
    const soporta = metodosDe(modelo).includes('generateContent') ? 'sí' : 'no';
    console.log(`- ${nombre} → generateContent: ${soporta}`);
  }

  const compatibles = modelos
    .filter((modelo) => metodosDe(modelo).includes('generateContent'))
    .map((modelo) => String(modelo.name ?? '').replace(/^models\//, ''));

  console.log(`\nCompatibles con generateContent: ${compatibles.length}`);
  if (compatibles.includes(modeloConfigurado)) {
    console.log(`GEMINI_MODELO=${modeloConfigurado} sí es compatible.`);
  } else {
    console.warn(
      `Atención: GEMINI_MODELO=${modeloConfigurado} no aparece como compatible. ` +
        'Ajusta la variable en backend/.env y reinicia el servidor.',
    );
  }
}

async function main() {
  if (!apiKey) {
    console.error('Falta GEMINI_API_KEY. Añádela a backend/.env y vuelve a ejecutar el script.');
    process.exitCode = 1;
    return;
  }

  console.log(`Consultando modelos de Gemini (modelo configurado: ${modeloConfigurado})...`);
  const modelos = await listarModelos();
  mostrarModelos(modelos);
}

await main().catch((error) => {
  console.error(`No se pudieron listar los modelos: ${error.message}`);
  process.exitCode = 1;
});
