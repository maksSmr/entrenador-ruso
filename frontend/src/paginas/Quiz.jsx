import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Boton from '../atomos/Boton';
import { EstadoCarga, EstadoError, EstadoVacio } from '../moleculas/Estado';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { enviarResultadoQuiz, obtenerQuiz } from '../servicios/api';

function textoOpcion(opcion) {
  if (opcion === null || opcion === undefined) return '';
  if (typeof opcion === 'string' || typeof opcion === 'number') return String(opcion);
  return opcion.texto ?? opcion.valor ?? opcion.opcion ?? opcion.palabra ?? JSON.stringify(opcion);
}

export default function Quiz() {
  const { leccionId } = useParams();
  const { token } = useAutenticacion();
  const [preguntas, setPreguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [seleccion, setSeleccion] = useState(null);
  const [puntaje, setPuntaje] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const referenciaMensaje = useRef(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await obtenerQuiz(leccionId, 4, token);
      setPreguntas(Array.isArray(datos) ? datos : []);
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setCargando(false);
    }
  }, [leccionId, token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (seleccion !== null && referenciaMensaje.current) referenciaMensaje.current.focus();
  }, [seleccion]);

  const pregunta = preguntas[indice];
  const respondida = seleccion !== null;
  const correcta = respondida && textoOpcion(seleccion) === textoOpcion(pregunta?.respuesta_correcta);
  const esUltima = indice + 1 >= preguntas.length;

  const enviarResultado = async (total) => {
    setEnviando(true);
    try {
      const datos = await enviarResultadoQuiz({ leccion_id: leccionId, puntaje: total, total: preguntas.length }, token);
      setResultado(datos);
    } catch (errorApi) {
      setResultado({ xp_ganado: 0, error: errorApi.message });
    } finally {
      setEnviando(false);
    }
  };

  const elegir = (opcion) => {
    if (respondida) return;
    setSeleccion(opcion);
    if (textoOpcion(opcion) === textoOpcion(pregunta.respuesta_correcta)) {
      setPuntaje((valor) => valor + 1);
    }
  };

  const siguiente = () => {
    if (esUltima) {
      enviarResultado(puntaje);
    } else {
      setIndice((valor) => valor + 1);
      setSeleccion(null);
    }
  };

  return (
    <>
      <DocumentoTitulo
        titulo="Quiz de la lección · Entrenador de ruso"
        descripcion="Pon a prueba lo que has aprendido con preguntas de opción múltiple y gana XP."
      />
      <section className="seccion seccion--estrecha quiz">
        <p className="eyebrow">Práctica</p>
        <h1>Quiz de la lección</h1>

        {cargando ? <EstadoCarga mensaje="Preparando las preguntas…" /> : null}
        {error ? <EstadoError mensaje={error} onReintentar={cargar} /> : null}
        {!cargando && !error && preguntas.length === 0 ? (
          <EstadoVacio titulo="No hay preguntas disponibles" mensaje="Esta lección todavía no tiene suficientes tarjetas para un quiz." />
        ) : null}

        {!cargando && !error && preguntas.length > 0 && !resultado ? (
          <div className="tarjeta pregunta">
            <p className="texto-pequeno">
              Pregunta {indice + 1} de {preguntas.length} · Puntaje: {puntaje}
            </p>
            <h2>{pregunta.enunciado}</h2>
            {pregunta.pista ? <p className="texto-suave">Pista: {pregunta.pista}</p> : null}
            <div className="opciones" role="group" aria-label="Opciones de respuesta">
              {(pregunta.opciones || []).map((opcion, indiceOpcion) => {
                const texto = textoOpcion(opcion);
                const esSeleccionada = respondida && textoOpcion(seleccion) === texto;
                const esCorrecta = texto === textoOpcion(pregunta.respuesta_correcta);
                return (
                  <button
                    key={`${texto}-${indiceOpcion}`}
                    type="button"
                    className={`opcion ${respondida && esCorrecta ? 'opcion--correcta' : ''} ${
                      esSeleccionada && !esCorrecta ? 'opcion--incorrecta' : ''
                    }`}
                    onClick={() => elegir(opcion)}
                    disabled={respondida}
                  >
                    <span aria-hidden="true">{esCorrecta && respondida ? '✓' : esSeleccionada ? '✗' : '○'}</span> {texto}
                  </button>
                );
              })}
            </div>
            <div ref={referenciaMensaje} tabIndex={-1} aria-live="assertive" role="status">
              {respondida ? (
                <p className={`aviso ${correcta ? 'aviso--exito' : 'aviso--error'}`}>
                  {correcta ? '✓ ¡Correcto!' : `✗ Incorrecto. La respuesta correcta es: ${textoOpcion(pregunta.respuesta_correcta)}`}
                </p>
              ) : null}
            </div>
            {respondida ? (
              <Boton onClick={siguiente} cargando={enviando}>
                {esUltima ? 'Ver resultado' : 'Siguiente pregunta'}
              </Boton>
            ) : null}
          </div>
        ) : null}

        {resultado ? (
          <div className="tarjeta aviso aviso--exito" aria-live="polite" role="status">
            <h2>🎉 Quiz terminado</h2>
            <p>
              Aciertos: {puntaje} de {preguntas.length}
            </p>
            <p>XP ganados: {resultado.xp_ganado ?? 0}</p>
            <p>Nivel: {resultado.nivel ?? '—'} · Racha: {resultado.racha ?? '—'}</p>
            {resultado.desglose ? <pre className="desglose">{JSON.stringify(resultado.desglose, null, 2)}</pre> : null}
            {resultado.error ? <p className="aviso aviso--error">{resultado.error}</p> : null}
            <Link className="enlace-boton" to="/panel">
              Volver a mi panel
            </Link>
          </div>
        ) : null}
      </section>
    </>
  );
}
