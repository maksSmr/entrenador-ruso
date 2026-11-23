import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { ErrorApi } from './errorApi.js';

export const MAX_FILAS_CSV = 500;

const REQUERIDAS = ['palabra', 'transliteracion', 'traduccion'];
const OPCIONALES = ['acento_posicion', 'ejemplo_ruso', 'ejemplo_traduccion', 'audio_url'];
const COLUMNAS = [...REQUERIDAS, ...OPCIONALES];

// "Transliteración" y "transliteracion" son la misma columna.
const normalizar = (nombre) => nombre
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, '_');

const filaEsquema = z.object({
  palabra: z.string().trim().min(1).max(200),
  transliteracion: z.string().trim().min(1).max(200),
  traduccion: z.string().trim().min(1).max(500),
  acento_posicion: z.coerce.number().int().min(0).max(199).nullable().optional(),
  ejemplo_ruso: z.string().trim().max(500).nullable().optional(),
  ejemplo_traduccion: z.string().trim().max(500).nullable().optional(),
  audio_url: z.string().trim().url().max(500).nullable().optional(),
});

// Función pura: se prueba sin base de datos.
export function parsearCsv(texto) {
  let filas;
  try {
    filas = parse(texto, { bom: true, trim: true, skip_empty_lines: false, relax_column_count: true });
  } catch (error) {
    throw new ErrorApi(400, 'El archivo no es un CSV válido', 'csv_invalido', error.message);
  }

  const [cabecera, ...datos] = filas;
  if (!cabecera) throw new ErrorApi(400, 'El CSV está vacío', 'csv_vacio');

  if (datos.length > MAX_FILAS_CSV) {
    throw new ErrorApi(400, `El CSV supera el máximo de ${MAX_FILAS_CSV} filas`, 'csv_demasiadas_filas');
  }

  const cabeceras = cabecera.map(normalizar);
  const faltan = REQUERIDAS.filter((columna) => !cabeceras.includes(columna));
  if (faltan.length) {
    throw new ErrorApi(400, `Faltan columnas: ${faltan.join(', ')}`, 'csv_columnas_faltantes');
  }

  const posiciones = Object.fromEntries(
    COLUMNAS.map((columna) => [columna, cabeceras.indexOf(columna)]),
  );

  const razones = {
    filas_vacias: 0,
    duplicadas_en_archivo: 0,
    filas_invalidas: [],
  };
  const filasValidas = [];
  const palabrasVistas = new Set();

  datos.forEach((fila, indice) => {
    const numeroFila = indice + 2; // la fila 1 es la cabecera

    if (!fila.length || fila.every((valor) => !valor || !valor.trim())) {
      razones.filas_vacias += 1;
      return;
    }

    const objeto = Object.fromEntries(
      REQUERIDAS.map((columna) => [columna, fila[posiciones[columna]] ?? '']),
    );
    COLUMNAS.filter((c) => OPCIONALES.includes(c)).forEach((columna) => {
      const posicion = posiciones[columna];
      const valor = posicion >= 0 ? fila[posicion] : '';
      if (valor && valor.trim()) objeto[columna] = valor.trim();
    });

    const resultado = filaEsquema.safeParse(objeto);
    if (!resultado.success) {
      razones.filas_invalidas.push({ fila: numeroFila, campos: resultado.error.flatten().fieldErrors });
      return;
    }

    if (palabrasVistas.has(resultado.data.palabra)) {
      razones.duplicadas_en_archivo += 1;
      return;
    }
    palabrasVistas.add(resultado.data.palabra);
    filasValidas.push(resultado.data);
  });

  if (razones.filas_invalidas.length) {
    throw new ErrorApi(400, 'El CSV contiene filas inválidas', 'csv_filas_invalidas', razones);
  }

  return { filasValidas, razones };
}
