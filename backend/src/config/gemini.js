// Configuración de Gemini compartida por la API, el servicio y el script de diagnóstico.
// La clave NUNCA se guarda aquí: solo se lee de las variables de entorno.
export const GEMINI_MODELO_POR_DEFECTO = 'gemini-3.8-flash';

// Tres reintentos: esperas progresivas de 1 s, 2 s y 4 s antes de fallar.
export const GEMINI_ESPERAS_REINTENTO_MS = [1000, 2000, 4000];
