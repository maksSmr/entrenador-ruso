import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { ErrorApi } from './errorApi.js';

// pdf-parse 1.1.1 intenta leer un PDF de prueba al importar el índice principal.
// Importar la implementación directa evita ese efecto secundario en el servidor.
export const EXTENSIONES_PERMITIDAS = ['pdf', 'docx'];
export const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB en memoria
export const TEXTO_MAXIMO = 12000; // ~3-4 páginas: suficiente para 24 tarjetas

export function extensionArchivo(nombre = '') {
  const parte = String(nombre).toLowerCase();
  const punto = parte.lastIndexOf('.');
  return punto === -1 ? '' : parte.slice(punto + 1);
}

/** Normaliza el texto antes de enviarlo a Gemini: sin nulos, saltos excesivos ni fugas de contexto. */
export function sanearTexto(texto, maximo = TEXTO_MAXIMO) {
  return String(texto ?? '')
    .replace(/\u0000/g, ' ')
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maximo);
}

/** Extrae texto plano de un archivo subido con multer (buffer en memoria). */
export async function extraerTexto(archivo) {
  if (!archivo?.buffer) {
    throw new ErrorApi(400, 'Falta el archivo en el campo "archivo"', 'archivo_faltante');
  }

  const extension = extensionArchivo(archivo.originalname);
  if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
    throw new ErrorApi(400, 'Solo se aceptan archivos .pdf o .docx', 'archivo_no_documento');
  }

  if (archivo.size > TAMANO_MAXIMO || archivo.buffer.length > TAMANO_MAXIMO) {
    throw new ErrorApi(413, 'El archivo supera el límite de 5 MB', 'archivo_demasiado_grande');
  }

  try {
    const extraido = extension === 'pdf'
      ? (await pdf(archivo.buffer)).text
      : (await mammoth.extractRawText({ buffer: archivo.buffer })).value;
    return sanearTexto(extraido);
  } catch (error) {
    // El mensaje de la librería puede contener rutas: se registra en servidor, no se devuelve.
    console.error(`No se pudo leer el archivo ${extension}:`, error.message);
    throw new ErrorApi(400, `No se pudo extraer texto del archivo ${extension.toUpperCase()}`, 'archivo_ilegible');
  }
}
