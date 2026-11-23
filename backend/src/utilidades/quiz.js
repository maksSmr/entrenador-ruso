// Generador puro de preguntas: dos tipos, 4 opciones y orden aleatorio.
export const TIPOS_PREGUNTA = ['traduccion', 'palabra'];

function mezclar(lista, aleatorio) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function generarPreguntas(tarjetas, cantidad = 4, aleatorio = Math.random) {
  if (tarjetas.length < 2) return [];

  const seleccionadas = mezclar(tarjetas, aleatorio).slice(0, Math.max(1, cantidad));

  return seleccionadas.map((tarjeta, indice) => {
    const tipo = TIPOS_PREGUNTA[indice % TIPOS_PREGUNTA.length];
    const campoCorrecto = tipo === 'traduccion' ? 'traduccion' : 'palabra';
    const respuesta = tarjeta[campoCorrecto];

    const distractores = tarjetas
      .filter((otra) => otra.id !== tarjeta.id && otra[campoCorrecto] !== respuesta)
      .map((otra) => otra[campoCorrecto]);

    const opciones = mezclar(
      [respuesta, ...mezclar(distractores, aleatorio).slice(0, 3)],
      aleatorio,
    );

    return {
      tipo,
      tarjeta_id: tarjeta.id,
      enunciado: tipo === 'traduccion'
        ? `¿Qué significa «${tarjeta.palabra}»?`
        : `¿Cuál es la palabra para «${tarjeta.traduccion}»?`,
      pista: tipo === 'traduccion' ? tarjeta.transliteracion : undefined,
      opciones,
      respuesta_correcta: respuesta,
    };
  });
}
