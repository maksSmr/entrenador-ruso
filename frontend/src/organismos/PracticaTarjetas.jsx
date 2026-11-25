import { useState } from 'react';
import Boton from '../atomos/Boton';
import BarraProgreso from '../moleculas/BarraProgreso';
import TarjetaPalabra from '../moleculas/TarjetaPalabra';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { responderRepaso } from '../servicios/api';

/**
 * Práctica de TODAS las tarjetas cargadas de una lección, sin filtro de "pendientes hoy".
 * Cada respuesta usa el mismo endpoint que el repaso espaciado, así que actualiza la caja Leitner.
 */
export default function PracticaTarjetas({ tarjetas, idioma = 'ruso', onSalir }) {
  const { token } = useAutenticacion();
  const [indice, setIndice] = useState(0);
  const [volteada, setVolteada] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [respondiendo, setRespondiendo] = useState(false);
  const [error, setError] = useState('');
  const [finalizado, setFinalizado] = useState(false);

  const tarjeta = tarjetas[indice];

  const reiniciar = () => {
    setIndice(0);
    setVolteada(false);
    setAciertos(0);
    setFallos(0);
    setError('');
    setFinalizado(false);
  };

  const responder = async (acerto) => {
    if (!tarjeta || !volteada || respondiendo) return;
    setRespondiendo(true);
    setError('');
    try {
      await responderRepaso({ tarjeta_id: tarjeta.id, acerto }, token);
      if (acerto) setAciertos((valor) => valor + 1);
      else setFallos((valor) => valor + 1);
      setVolteada(false);
      if (indice + 1 >= tarjetas.length) setFinalizado(true);
      else setIndice((valor) => valor + 1);
    } catch (errorApi) {
      setError(errorApi.message || 'No se pudo guardar tu respuesta.');
    } finally {
      setRespondiendo(false);
    }
  };

  if (!tarjetas.length) return null;

  return (
    <div className="seccion seccion--estrecha repaso" aria-live="polite">
      {finalizado ? (
        <div className="tarjeta aviso aviso--exito" role="status">
          <h2>🎉 Práctica completada</h2>
          <p>Acertaste {aciertos} de {tarjetas.length} tarjetas. Fallaste {fallos}.</p>
          <div className="fila-acciones">
            <Boton onClick={reiniciar}>Practicar de nuevo</Boton>
            {onSalir ? (
              <Boton variante="secundario" onClick={onSalir}>Ver el listado</Boton>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <p className="texto-pequeno">
            Tarjeta {indice + 1} de {tarjetas.length} · {aciertos} aciertos · {fallos} fallos
          </p>
          <BarraProgreso valor={indice} maximo={tarjetas.length} etiqueta="Progreso de la práctica" />
          <TarjetaPalabra
            tarjeta={tarjeta}
            idioma={idioma}
            volteada={volteada}
            interactiva
            onVoltear={() => setVolteada((valor) => !valor)}
          />
          <div className="fila-acciones repaso__acciones">
            <Boton
              variante="exito"
              onClick={() => responder(true)}
              disabled={!volteada || respondiendo}
              aria-label="Lo sabía: subir de caja"
            >
              <span aria-hidden="true">✓</span> Lo sabía
            </Boton>
            <Boton
              variante="peligro"
              onClick={() => responder(false)}
              disabled={!volteada || respondiendo}
              aria-label="No lo sabía: volver a la caja 1"
            >
              <span aria-hidden="true">✗</span> No lo sabía
            </Boton>
          </div>
          {!volteada ? (
            <p className="pista-volteo">Pulsa la tarjeta, Intro o Espacio para ver la respuesta.</p>
          ) : null}
          {error ? (
            <p className="aviso aviso--error" role="alert">⚠ {error}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
