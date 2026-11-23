import { useEffect, useMemo, useRef, useState } from 'react';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Boton from '../atomos/Boton';
import Campo from '../atomos/Campo';
import Insignia from '../atomos/Insignia';
import { ABECEDARIO_RUSO, FRASES_EJEMPLO, TECLADO_CIRILICO, hablar } from '../utilidades/audio';
import { compararRespuesta, marcarAcento, posicionesVocales } from '../utilidades/cirilico';

const GRUPOS = [
  { titulo: 'Se parecen al español', letras: ['А', 'К', 'М', 'О', 'Т'] },
  { titulo: 'Falsas amigas', letras: ['В', 'Н', 'Р', 'С', 'У', 'Х'] },
  { titulo: 'Nuevas', letras: ['Б', 'Г', 'Д', 'Ж', 'З', 'И', 'Й', 'Л', 'П', 'Ф', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'] },
];

const PALABRAS_EJERCICIO = [
  { esperada: 'мама', pista: 'mamá' },
  { esperada: 'книга', pista: 'libro' },
  { esperada: 'вода', pista: 'agua' },
  { esperada: 'приве\u0301т', pista: 'hola, con acento en la e' },
];

export default function HerramientasRuso() {
  const [letraIndice, setLetraIndice] = useState(0);
  const [opcionLetra, setOpcionLetra] = useState(null);
  const [palabraIndice, setPalabraIndice] = useState(0);
  const [escrita, setEscrita] = useState('');
  const [comparacion, setComparacion] = useState(null);
  const [palabraAcento, setPalabraAcento] = useState('привет');
  const [posicionAcento, setPosicionAcento] = useState(2);
  const [avisoAudio, setAvisoAudio] = useState('');
  const areaReferencia = useRef(null);

  const letra = ABECEDARIO_RUSO[letraIndice];
  const opcionesLetra = useMemo(() => {
    const start = letraIndice % (ABECEDARIO_RUSO.length - 3);
    return [0, 1, 2].map((desplazamiento) => ABECEDARIO_RUSO[(start + desplazamiento) % ABECEDARIO_RUSO.length]);
  }, [letraIndice]);
  const acertadoLetra = opcionLetra !== null && opcionesLetra[opcionLetra]?.letra === letra.letra;
  const vocales = posicionesVocales(palabraAcento);

  useEffect(() => {
    if (vocales.length && !vocales.includes(posicionAcento)) {
      setPosicionAcento(vocales[0]);
    }
  }, [vocales.join(','), posicionAcento]);

  const escribir = (caracter) => {
    setEscrita((anterior) => anterior + caracter);
    if (areaReferencia.current) areaReferencia.current.focus();
  };

  const escuchar = (texto) => {
    const resultado = hablar(texto, { idioma: 'ruso' });
    setAvisoAudio(resultado.ok ? '' : resultado.mensaje);
  };

  const comprobar = () => {
    setComparacion(compararRespuesta(escrita, PALABRAS_EJERCICIO[palabraIndice].esperada));
  };

  return (
    <>
      <DocumentoTitulo
        titulo="Herramientas de ruso · Entrenador de ruso"
        descripcion="Entrena el alfabeto cirílico, practica el acento tónico y escribe con el teclado ruso en pantalla."
      />
      <section className="seccion">
        <p className="eyebrow">Práctica de cirílico</p>
        <h1>Herramientas de ruso</h1>
        <p className="texto-suave">
         Todo en español: reconoce letras, marca el acento y escribe tus respuestas con el teclado cirílico.
        </p>

        <section aria-labelledby="alfabeto-titulo" className="seccion">
          <h2 id="alfabeto-titulo">Entrenador del alfabeto (33 letras)</h2>
          <div className="rejilla-tres">
            {GRUPOS.map((grupo) => (
              <article className="tarjeta" key={grupo.titulo}>
                <h3>{grupo.titulo}</h3>
                <div className="letras">
                  {grupo.letras.map((letraGrupo) => (
                    <button
                      key={letraGrupo}
                      type="button"
                      className="letra"
                      aria-label={`Escuchar la letra ${letraGrupo}`}
                      onClick={() => escuchar(letraGrupo)}
                    >
                      {letraGrupo}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className="texto-pequeno texto-suave">
            Nota: Е y Ё se trabajan en el módulo de acento tónico; Ё siempre lleva la tilde.
          </p>

          <div className="tarjeta ejercicio">
            <h3>Ejercicio: letra → sonido</h3>
            <p>
              ¿Cómo se llama la letra <strong lang="ru">{letra.letra}</strong>?
            </p>
            <div className="fila-acciones" role="group" aria-label="Opciones de nombre de la letra">
              {opcionesLetra.map((opcion, indice) => (
                <Boton
                  key={`${opcion.letra}-${indice}`}
                  variante={opcionLetra === indice ? (acertadoLetra ? 'exito' : 'peligro') : 'secundario'}
                  onClick={() => setOpcionLetra(indice)}
                >
                  {opcion.nombre}
                </Boton>
              ))}
            </div>
            <p aria-live="polite" role="status">
              {opcionLetra === null
                ? ''
                : acertadoLetra
                  ? '✓ Correcto. Esa es la letra que escuchaste.'
                  : `✗ No. ${letra.letra} se llama «${letra.nombre}».`}
            </p>
            <Boton
              variante="fantasma"
              tamano="pequeno"
              onClick={() => {
                setLetraIndice((valor) => (valor + 1) % ABECEDARIO_RUSO.length);
                setOpcionLetra(null);
              }}
            >
              Otra letra
            </Boton>
          </div>
        </section>

        <section aria-labelledby="acento-titulo" className="seccion">
          <h2 id="acento-titulo">Calculadora de acento tónico</h2>
          <div className="tarjeta ejercicio">
            <Campo id="acento-palabra" etiqueta="Palabra en ruso" valor={palabraAcento} onChange={setPalabraAcento} />
            <div className="campo">
              <label htmlFor="acento-posicion">Vocal que lleva el acento</label>
              <select
                id="acento-posicion"
                value={posicionAcento}
                onChange={(evento) => setPosicionAcento(Number(evento.target.value))}
              >
                {(vocales.length ? vocales : [1]).map((posicion) => (
                  <option key={posicion} value={posicion}>
                    Vocal {posicion}
                  </option>
                ))}
              </select>
            </div>
            <p
              className="resultado-acento"
              lang="ru"
              aria-label={`Palabra con acento tónico: ${marcarAcento(palabraAcento, posicionAcento)}. El acento se marca con un agudo sobre la vocal ${posicionAcento}.`}
            >
              {marcarAcento(palabraAcento, posicionAcento)}
            </p>
            <Boton variante="secundario" tamano="pequeno" onClick={() => escuchar(marcarAcento(palabraAcento, posicionAcento))}>
              <span aria-hidden="true">🔊</span> Escuchar acento
            </Boton>
          </div>
        </section>

        <section aria-labelledby="teclado-titulo" className="seccion">
          <h2 id="teclado-titulo">Escribe con el teclado cirílico</h2>
          <div className="tarjeta ejercicio">
            <h3>Ejercicio: formar palabras</h3>
            <p>
              Escribe <strong>{PALABRAS_EJERCICIO[palabraIndice].pista}</strong> en ruso.
            </p>
            <div className="campo">
              <label htmlFor="respuesta-cirilica">Tu respuesta</label>
              <textarea
                id="respuesta-cirilica"
                ref={areaReferencia}
                value={escrita}
                onChange={(evento) => setEscrita(evento.target.value)}
                rows={2}
                lang="ru"
              />
            </div>
            <div className="teclado" aria-label="Teclado cirílico en pantalla">
              {TECLADO_CIRILICO.map((fila, indiceFila) => (
                <div className="teclado__fila" key={indiceFila}>
                  {fila.map((caracter) => (
                    <button
                      key={caracter}
                      type="button"
                      className="tecla"
                      aria-label={`Escribir ${caracter}`}
                      onClick={() => escribir(caracter)}
                    >
                      {caracter}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="tecla tecla--accion"
                    aria-label="Borrar último carácter"
                    onClick={() => setEscrita((anterior) => anterior.slice(0, -1))}
                  >
                    ⌫
                  </button>
                </div>
              ))}
            </div>
            <div className="fila-acciones">
              <Boton onClick={comprobar}>Comprobar respuesta</Boton>
              <Boton
                variante="secundario"
                onClick={() => {
                  setEscrita('');
                  setComparacion(null);
                  setPalabraIndice((valor) => (valor + 1) % PALABRAS_EJERCICIO.length);
                }}
              >
                Otra palabra
              </Boton>
            </div>
            <div aria-live="assertive" role="status" tabIndex={-1}>
              {comparacion ? (
                <p className={`aviso ${comparacion.correcta ? 'aviso--exito' : 'aviso--error'}`}>
                  {comparacion.correcta ? '✓ ' : '✗ '}
                  {comparacion.mensaje}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section aria-labelledby="frases-titulo" className="seccion">
          <h2 id="frases-titulo">Frases de ejemplo</h2>
          <div className="rejilla-dos">
            {FRASES_EJEMPLO.map((frase) => (
              <article className="tarjeta frase" key={frase.ruso}>
                <div>
                  <p className="ejemplo-ruso" lang="ru">
                    {frase.ruso}
                  </p>
                  <p className="texto-suave">{frase.transliteracion}</p>
                  <p className="texto-pequeno">{frase.espanol}</p>
                </div>
                <Boton
                  variante="fantasma"
                  tamano="pequeno"
                  aria-label={`Escuchar la frase ${frase.ruso}`}
                  onClick={() => escuchar(frase.ruso)}
                >
                  <span aria-hidden="true">🔊</span> Escuchar
                </Boton>
              </article>
            ))}
          </div>
          <p className="texto-pequeno" role="status" aria-live="polite">
            {avisoAudio}
          </p>
          <Insignia tono="neutro">Idioma de audio: ruso (ru-RU)</Insignia>
        </section>
      </section>
    </>
  );
}
