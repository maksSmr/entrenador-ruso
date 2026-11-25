import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// La clave se simula: nunca se usa una real en las pruebas.
const entornoFalso = { geminiApiKey: 'clave-de-prueba', geminiModelo: 'gemini-2.5-flash' };
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
    expect(url).toContain('gemini-2.5-flash:generateContent');
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
});
