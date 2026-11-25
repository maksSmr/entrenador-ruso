import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  GEMINI_ESPERAS_REINTENTO_MS,
  GEMINI_MODELO_POR_DEFECTO,
} from '../src/config/gemini.js';

// La clave se simula: nunca se usa una real en las pruebas.
const entornoFalso = { geminiApiKey: 'clave-de-prueba', geminiModelo: GEMINI_MODELO_POR_DEFECTO };
jest.unstable_mockModule('../src/config/entorno.js', () => ({ entorno: entornoFalso }));

const { entorno } = await import('../src/config/entorno.js');
const { sanearTexto } = await import('../src/utilidades/documentos.js');
const {
  normalizarSugerencia,
  parsearRespuesta,
  generarSugerencias,
} = await import('../src/servicios/gemini.servicio.js');

const respuestaOk = (textoGenerado) => ({
  ok: true,
  json: async () => ({ candidates: [{ content: { parts: [{ text: textoGenerado }] } }] }),
  text: async () => '',
});

const respuestaError = (status, detalle = '') => ({
  ok: false,
  status,
  text: async () => detalle,
});

const sugerencia = (palabra) => ({
  palabra,
  transliteracion: 'privet',
  traduccion: 'hola',
  ejemplo_ruso: 'Привет, Анна!',
  ejemplo_traduccion: '¡Hola, Ana!',
  nota_gramatical: 'Saludo informal',
  acento_posicion: 2,
});

beforeEach(() => {
  entorno.geminiApiKey = 'clave-de-prueba';
  entorno.geminiModelo = GEMINI_MODELO_POR_DEFECTO;
});

describe('saneamiento del documento', () => {
  test('elimina caracteres de control y espacios excesivos', () => {
    expect(sanearTexto('Привет\u0000  \n\n\n  мир', 100)).toBe('Привет\n\nмир');
  });

  test('recorta el texto enviado a Gemini', () => {
    expect(sanearTexto('a'.repeat(500), 10)).toHaveLength(10);
  });
});

describe('normalización de sugerencias de Gemini', () => {
  test('descarta tarjetas incompletas y conserva la nota gramatical', () => {
    expect(normalizarSugerencia({ palabra: 'привет' })).toBeNull();
    const resultado = normalizarSugerencia(sugerencia('привет'));
    expect(resultado).toMatchObject({
      palabra: 'привет',
      nota_gramatical: 'Saludo informal',
      acento_posicion: 2,
    });
  });

  test('acepta JSON envuelto en bloques y quita duplicados', () => {
    const texto = `\`\`\`json
      {"tarjetas": [${JSON.stringify(sugerencia('привет'))}, ${JSON.stringify(sugerencia('привет'))}, ${JSON.stringify(sugerencia('мир'))}]}
    \`\`\``;
    expect(parsearRespuesta(texto).map((tarjeta) => tarjeta.palabra)).toEqual(['привет', 'мир']);
  });

  test('avisa con un código claro si la respuesta no es JSON', () => {
    try {
      parsearRespuesta('Lo siento, no puedo hacerlo');
      throw new Error('Debería haber fallado');
    } catch (error) {
      expect(error.codigo).toBe('gemini_respuesta_invalida');
      expect(error.status).toBe(502);
    }
  });
});

describe('llamada a Gemini', () => {
  test('envía la clave solo en la URL del servidor y devuelve tarjetas', async () => {
    const fetchFn = jest.fn(async () => respuestaOk(JSON.stringify({ tarjetas: [sugerencia('привет')] })));
    const resultado = await generarSugerencias('привет мир', { fetchFn });

    expect(resultado[0].palabra).toBe('привет');
    const [url, opciones] = fetchFn.mock.calls[0];
    expect(url).toContain(`${GEMINI_MODELO_POR_DEFECTO}:generateContent`);
    expect(url).toContain('key=clave-de-prueba');
    expect(JSON.parse(opciones.body).generationConfig.responseMimeType).toBe('application/json');
  });

  test('traduce un error de clave en un ErrorApi sin filtrar secretos', async () => {
    const errorConsola = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await generarSugerencias('texto', {
        fetchFn: async () => ({ ok: false, status: 401, text: async () => 'API_KEY_INVALID' }),
      });
      throw new Error('Debería haber fallado');
    } catch (error) {
      expect(error.status).toBe(502);
      expect(error.codigo).toBe('gemini_error');
      expect(error.message).not.toContain('clave-de-prueba');
    } finally {
      errorConsola.mockRestore();
    }
  });

  test('sin GEMINI_API_KEY responde 503 con instrucción de configuración', async () => {
    entorno.geminiApiKey = '';
    await expect(generarSugerencias('texto', { fetchFn: jest.fn() })).rejects.toMatchObject({
      status: 503,
      codigo: 'gemini_sin_configuracion',
    });
  });

  test('permite sobreescribir el modelo mediante GEMINI_MODELO', async () => {
    entorno.geminiModelo = 'modelo-personalizado';
    const fetchFn = jest.fn(async () => respuestaOk(JSON.stringify({ tarjetas: [sugerencia('привет')] })));

    await generarSugerencias('привет мир', { fetchFn });

    expect(fetchFn.mock.calls[0][0]).toContain('modelo-personalizado:generateContent');
  });
});

describe('reintentos ante saturación temporal de Gemini', () => {
  let aviso;

  beforeEach(() => {
    aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    aviso.mockRestore();
  });

  test('reintenta ante 503 y devuelve tarjetas cuando Gemini se recupera', async () => {
    const esperarFn = jest.fn(async () => {});
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(respuestaError(503, 'UNAVAILABLE'))
      .mockResolvedValueOnce(respuestaError(503, 'UNAVAILABLE'))
      .mockResolvedValueOnce(respuestaOk(JSON.stringify({ tarjetas: [sugerencia('привет')] })));

    const resultado = await generarSugerencias('привет мир', { fetchFn, esperarFn });

    expect(resultado[0].palabra).toBe('привет');
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(esperarFn.mock.calls.map(([ms]) => ms)).toEqual([1000, 2000]);
    expect(aviso).toHaveBeenCalledTimes(2);
  });

  test('reintenta ante 429 (límite de tasa) y continúa', async () => {
    const esperarFn = jest.fn(async () => {});
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(respuestaError(429, 'RATE_LIMIT_EXCEEDED'))
      .mockResolvedValueOnce(respuestaOk(JSON.stringify({ tarjetas: [sugerencia('мир')] })));

    const resultado = await generarSugerencias('привет мир', { fetchFn, esperarFn });

    expect(resultado[0].palabra).toBe('мир');
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(esperarFn.mock.calls.map(([ms]) => ms)).toEqual([1000]);
  });

  test('falla limpiamente tras 3 reintentos si el 503 persiste', async () => {
    const errorConsola = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const esperarFn = jest.fn(async () => {});
      const fetchFn = jest.fn(async () => respuestaError(503, 'UNAVAILABLE clave-de-prueba'));

      const error = await generarSugerencias('texto', { fetchFn, esperarFn }).catch((fallo) => fallo);

      expect(error).toMatchObject({ status: 503, codigo: 'gemini_no_disponible' });
      expect(error.message).not.toContain('clave-de-prueba');
      expect(fetchFn).toHaveBeenCalledTimes(4);
      expect(esperarFn.mock.calls.map(([ms]) => ms)).toEqual(GEMINI_ESPERAS_REINTENTO_MS);

      const registro = errorConsola.mock.calls.map((args) => args.join(' ')).join(' ');
      expect(registro).not.toContain('clave-de-prueba');
    } finally {
      errorConsola.mockRestore();
    }
  });
});
