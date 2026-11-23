import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Boton from '../atomos/Boton';
import BarraProgreso from '../moleculas/BarraProgreso';
import TarjetaPalabra from '../moleculas/TarjetaPalabra';
import { EstadoCarga, EstadoError, EstadoVacio } from '../moleculas/Estado';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { listarMisCursos, listarRepaso, responderRepaso } from '../servicios/api';

/** Componente presentacional de una tarjeta de repaso (fácil de probar con RTL). */
export function TarjetaRepaso({ tarjeta, idioma = 'ruso', volteada, onVoltear, onResponder, respondiendo = false }) {
  return (
    <div className="repaso__tarjeta">
      <TarjetaPalabra
        tarjeta={tarjeta}
        idioma={idioma}
        volteada={volteada}
        interactiva
        onVoltear={onVoltear}
      />
      <div className="fila-acciones repaso__acciones">
        <Boton
          variante="exito"
          onClick={() => onResponder(true)}
          disabled={!volteada || respondiendo}
          aria-label="Lo sabía: subir de caja"
        >
          <span aria-hidden="true">✓</span> Lo sabía
        </Boton>
        <Boton
          variante="peligro"
          onClick={() => onResponder(false)}
          disabled={!volteada || respondiendo}
          aria-label="No lo sabía: volver a la caja 1"
        >
          <span aria-hidden="true">✗</span> No lo sabía
        </Boton>
      </div>
    </div>
  );
}

export default function Repaso() {
  const { cursoId } = useParams();
  const { token } = useAutenticacion();
  const [tarjetas, setTarjetas] = useState([]);
  const [idioma, setIdioma] = useState('ruso');
  const [indice, setIndice] = useState(0);
  const [volteada, setVolteada] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorRespuesta, setErrorRespuesta] = useState('');
  const [respondiendo, setRespondiendo] = useState(false);
  const [finalizado, setFinalizado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [datosTarjetas, datosCursos] = await Promise.all([
        listarRepaso(cursoId, token),
        listarMisCursos(token).catch(() => []),
      ]);
      setTarjetas(Array.isArray(datosTarjetas) ? datosTarjetas : []);
      const curso = (datosCursos || []).find((item) => String(item.id) === String(cursoId));
      if (curso?.idioma) setIdioma(curso.idioma);
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setCargando(false);
    }
  }, [cursoId, token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const responder = async (acerto) => {
    const tarjeta = tarjetas[indice];
    if (!tarjeta || !volteada || respondiendo) return;
    setRespondiendo(true);
    setErrorRespuesta('');
    try {
      await responderRepaso({ tarjeta_id: tarjeta.id, acerto }, token);
      if (acerto) setAciertos((valor) => valor + 1);
      else setFallos((valor) => valor + 1);
      setVolteada(false);
      if (indice + 1 >= tarjetas.length) {
        setFinalizado(true);
      } else {
        setIndice((valor) => valor + 1);
      }
    } catch (errorApi) {
      setErrorRespuesta(errorApi.message || 'No se pudo guardar tu respuesta.');
    } finally {
      setRespondiendo(false);
    }
  };

  const tarjeta = tarjetas[indice];

  return (
    <>
      <DocumentoTitulo
        titulo="Repaso de hoy · Entrenador de ruso"
        descripcion="Repasa tus tarjetas con el sistema de 5 cajas y marca si acertaste o no."
      />
      <section className="seccion seccion--estrecha repaso">
        <p className="eyebrow">Repaso espaciado</p>
        <h1>Repaso de hoy</h1>

        {cargando ? <EstadoCarga mensaje="Preparando tus tarjetas…" /> : null}
        {error ? <EstadoError mensaje={error} onReintentar={cargar} /> : null}
        {!cargando && !error && tarjetas.length === 0 ? (
          <EstadoVacio
            titulo="¡Todo al día!"
            mensaje="No tienes tarjetas pendientes hoy. Vuelve mañana o practica con un quiz."
          >
            <Link className="enlace-boton" to="/panel">
              Volver a mi panel
            </Link>
          </EstadoVacio>
        ) : null}

        {!cargando && !error && tarjetas.length > 0 ? (
          <div aria-live="polite">
            {finalizado ? (
              <div className="tarjeta aviso aviso--exito" role="status">
                <h2>🎉 Repaso completado</h2>
                <p>
                  Acertaste {aciertos} de {tarjetas.length} tarjetas. Fallaste {fallos}.
                </p>
                <div className="fila-acciones">
                  <Link className="enlace-boton" to="/panel">
                    Volver a mi panel
                  </Link>
                  <Boton onClick={cargar}>Repasar de nuevo</Boton>
                </div>
              </div>
            ) : (
              <>
                <p className="texto-pequeno">
                  Tarjeta {indice + 1} de {tarjetas.length} · {aciertos} aciertos · {fallos} fallos
                </p>
                <BarraProgreso
                  valor={indice}
                  maximo={tarjetas.length}
                  etiqueta="Progreso del repaso"
                />
                <TarjetaRepaso
                  tarjeta={tarjeta}
                  idioma={idioma}
                  volteada={volteada}
                  onVoltear={() => setVolteada((valor) => !valor)}
                  onResponder={responder}
                  respondiendo={respondiendo}
                />
                {!volteada ? (
                  <p className="pista-volteo">Pulsa la tarjeta, Intro o Espacio para ver la respuesta.</p>
                ) : null}
              </>
            )}
            {errorRespuesta ? (
              <p className="aviso aviso--error" role="alert">
                ⚠ {errorRespuesta}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  );
}
