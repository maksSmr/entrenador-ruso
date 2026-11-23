import { useState } from 'react';
import Boton from '../atomos/Boton';
import Insignia from '../atomos/Insignia';
import { hablar, codigoIdioma } from '../utilidades/audio';

export default function TarjetaPalabra({
  tarjeta,
  idioma = 'ruso',
  volteada = true,
  interactiva = false,
  onVoltear,
  children,
}) {
  const [avisoAudio, setAvisoAudio] = useState('');

  const reproducir = (evento) => {
    evento.stopPropagation();
    const resultado = hablar(tarjeta.palabra, { idioma });
    setAvisoAudio(resultado.ok ? '' : resultado.mensaje);
  };

  const etiquetaAcento =
    tarjeta.acento_posicion
      ? `Acento tónico en la vocal ${tarjeta.acento_posicion} de ${tarjeta.palabra}. Se marca con acento agudo.`
      : undefined;

  return (
    <article
      className={`tarjeta tarjeta-palabra ${interactiva ? 'tarjeta-palabra--interactiva' : ''}`}
      onClick={interactiva && onVoltear ? onVoltear : undefined}
      onKeyDown={
        interactiva && onVoltear
          ? (evento) => {
              if (evento.key === 'Enter' || evento.key === ' ' || evento.key === 'Spacebar') {
                evento.preventDefault();
                onVoltear();
              }
            }
          : undefined
      }
      role={interactiva ? 'button' : undefined}
      tabIndex={interactiva ? 0 : undefined}
      aria-label={interactiva ? `Tarjeta: ${tarjeta.palabra}. Pulsa Intro o Espacio para voltear.` : undefined}
      aria-pressed={interactiva ? volteada : undefined}
    >
      {tarjeta.imagen_url ? (
        <img className="tarjeta-palabra__imagen" src={tarjeta.imagen_url} alt={`Imagen de ${tarjeta.palabra}`} />
      ) : null}
      <div className="tarjeta-palabra__palabra">
        <h3>{tarjeta.palabra}</h3>
        <Boton
          variante="fantasma"
          tamano="pequeno"
          onClick={reproducir}
          aria-label={`Escuchar ${tarjeta.palabra} en ${idioma} (${codigoIdioma(idioma)})`}
        >
          <span aria-hidden="true">🔊</span> Escuchar
        </Boton>
      </div>
      <p className="texto-suave" aria-live="polite">
        {avisoAudio}
      </p>
      {tarjeta.transliteracion ? <p className="texto-suave">{tarjeta.transliteracion}</p> : null}
      {tarjeta.acento_posicion ? (
        <span aria-label={etiquetaAcento}>
          <Insignia tono="ambar">Acento {tarjeta.acento_posicion}</Insignia>
        </span>
      ) : null}
      {volteada ? (
        <div className="tarjeta-palabra__dorso">
          <p className="tarjeta-palabra__traduccion">{tarjeta.traduccion}</p>
          {tarjeta.ejemplo_ruso ? (
            <p className="ejemplo-ruso" lang={codigoIdioma(idioma)}>
              {tarjeta.ejemplo_ruso}
            </p>
          ) : null}
          {tarjeta.ejemplo_traduccion ? (
            <p className="texto-suave texto-pequeno">{tarjeta.ejemplo_traduccion}</p>
          ) : null}
        </div>
      ) : (
        <p className="pista-volteo">Pulsa, Intro o Espacio para ver la traducción</p>
      )}
      {children}
    </article>
  );
}
