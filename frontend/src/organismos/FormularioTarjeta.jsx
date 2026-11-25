import { useEffect, useState } from 'react';
import Boton from '../atomos/Boton';
import Campo, { AreaTexto } from '../atomos/Campo';

const VACIO = {
  palabra: '',
  transliteracion: '',
  traduccion: '',
  imagen_url: '',
  acento_posicion: '',
  ejemplo_ruso: '',
  ejemplo_traduccion: '',
  audio_url: '',
  nota_gramatical: '',
};

export default function FormularioTarjeta({ inicial, onSubmit, onCancelar, error, cargando = false }) {
  const [datos, setDatos] = useState({ ...VACIO, ...(inicial || {}) });

  useEffect(() => {
    setDatos({ ...VACIO, ...(inicial || {}) });
  }, [inicial]);

  const actualizar = (campo) => (valor) => setDatos((anterior) => ({ ...anterior, [campo]: valor }));

  const enviar = (evento) => {
    evento.preventDefault();
    if (!datos.palabra.trim() || !datos.transliteracion.trim() || !datos.traduccion.trim()) return;
    onSubmit({
      palabra: datos.palabra.trim(),
      transliteracion: datos.transliteracion.trim(),
      traduccion: datos.traduccion.trim(),
      imagen_url: datos.imagen_url.trim() || null,
      acento_posicion: datos.acento_posicion === '' ? null : Number(datos.acento_posicion),
      ejemplo_ruso: datos.ejemplo_ruso.trim() || null,
      ejemplo_traduccion: datos.ejemplo_traduccion.trim() || null,
      audio_url: datos.audio_url.trim() || null,
      nota_gramatical: datos.nota_gramatical.trim() || null,
    });
    if (!inicial) setDatos({ ...VACIO });
  };

  return (
    <form className="formulario" onSubmit={enviar}>
      <div className="rejilla-campos">
        <Campo id="tarjeta-palabra" etiqueta="Palabra" valor={datos.palabra} onChange={actualizar('palabra')} requerido />
        <Campo id="tarjeta-transliteracion" etiqueta="Transliteración" valor={datos.transliteracion} onChange={actualizar('transliteracion')} requerido />
        <Campo id="tarjeta-traduccion" etiqueta="Traducción" valor={datos.traduccion} onChange={actualizar('traduccion')} requerido />
        <Campo
          id="tarjeta-acento"
          etiqueta="Posición del acento (vocal)"
          tipo="number"
          min="1"
          valor={datos.acento_posicion}
          onChange={actualizar('acento_posicion')}
          ayuda="1 = primera vocal de la palabra."
        />
        <Campo id="tarjeta-imagen" etiqueta="URL de imagen (opcional)" tipo="url" valor={datos.imagen_url} onChange={actualizar('imagen_url')} />
        <Campo id="tarjeta-audio" etiqueta="URL de audio (opcional)" valor={datos.audio_url} onChange={actualizar('audio_url')} />
      </div>
      <AreaTexto id="tarjeta-ejemplo-ruso" etiqueta="Ejemplo en ruso" valor={datos.ejemplo_ruso} onChange={actualizar('ejemplo_ruso')} rows={2} />
      <AreaTexto id="tarjeta-ejemplo-traduccion" etiqueta="Traducción del ejemplo" valor={datos.ejemplo_traduccion} onChange={actualizar('ejemplo_traduccion')} rows={2} />
      <AreaTexto id="tarjeta-nota-gramatical" etiqueta="Nota gramatical o contextual (opcional)" valor={datos.nota_gramatical} onChange={actualizar('nota_gramatical')} rows={2} />
      {error ? (
        <p className="aviso aviso--error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      <div className="fila-acciones">
        <Boton type="submit" cargando={cargando}>
          {inicial ? 'Guardar cambios' : 'Añadir tarjeta'}
        </Boton>
        {onCancelar ? (
          <Boton variante="secundario" onClick={onCancelar}>
            Cancelar
          </Boton>
        ) : null}
      </div>
    </form>
  );
}
