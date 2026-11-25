import { useRef, useState } from 'react';
import Boton from '../atomos/Boton';
import Campo, { AreaTexto } from '../atomos/Campo';
import { crearTarjeta, generarTarjetasIA } from '../servicios/api';

const LIMITE_BYTES = 5 * 1024 * 1024;
const EXTENSIONES = /\.(pdf|docx)$/i;

const preparar = (lista) => (Array.isArray(lista) ? lista : []).map((sugerencia, indice) => ({
  id: `sugerencia-${Date.now()}-${indice}`,
  palabra: sugerencia.palabra ?? '',
  transliteracion: sugerencia.transliteracion ?? '',
  traduccion: sugerencia.traduccion ?? '',
  ejemplo_ruso: sugerencia.ejemplo_ruso ?? '',
  ejemplo_traduccion: sugerencia.ejemplo_traduccion ?? '',
  nota_gramatical: sugerencia.nota_gramatical ?? '',
  acento_posicion: sugerencia.acento_posicion ?? '',
}));

/**
 * Sube un PDF/DOCX, muestra las tarjetas que propone Gemini y deja que el maestro
 * las revise, edite o descarte antes de guardarlas con el endpoint de tarjetas.
 */
export default function GeneradorTarjetasIA({ leccionId, token, onGuardadas }) {
  const [archivo, setArchivo] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [procesados, setProcesados] = useState(0);
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [idsFallidas, setIdsFallidas] = useState([]);
  const entradaArchivo = useRef(null);

  const incompletas = sugerencias.some(
    (tarjeta) => !tarjeta.palabra.trim() || !tarjeta.transliteracion.trim() || !tarjeta.traduccion.trim(),
  );

  const seleccionar = (evento) => {
    const siguiente = evento.target.files?.[0] ?? null;
    setArchivo(siguiente);
    setError('');
    setMensaje('');
    if (!siguiente) return;
    if (!EXTENSIONES.test(siguiente.name)) {
      setArchivo(null);
      setError('Solo se aceptan archivos .pdf o .docx.');
      return;
    }
    if (siguiente.size > LIMITE_BYTES) {
      setArchivo(null);
      setError('El archivo supera el límite de 5 MB.');
    }
  };

  const cambiar = (id, campo) => (valor) => {
    setSugerencias((anteriores) => anteriores.map((tarjeta) => (
      tarjeta.id === id ? { ...tarjeta, [campo]: valor } : tarjeta
    )));
  };

  const descartar = (id) => {
    setSugerencias((anteriores) => anteriores.filter((tarjeta) => tarjeta.id !== id));
    setIdsFallidas((anteriores) => anteriores.filter((fallida) => fallida !== id));
  };

  const generar = async () => {
    if (!archivo || !leccionId) return;
    setGenerando(true);
    setError('');
    setMensaje('');
    try {
      const respuesta = await generarTarjetasIA(leccionId, archivo, token);
      setSugerencias(preparar(respuesta?.sugerencias));
      setIdsFallidas([]);
      setProcesados(Number(respuesta?.caracteres_procesados) || 0);
      if (!respuesta?.sugerencias?.length) {
        setMensaje('Gemini no encontró vocabulario útil en el documento.');
      }
    } catch (errorApi) {
      setSugerencias([]);
      setIdsFallidas([]);
      setError(errorApi.message || 'No se pudieron generar las tarjetas.');
    } finally {
      setGenerando(false);
    }
  };

  const guardar = async () => {
    if (!sugerencias.length || incompletas || guardando) return;
    setGuardando(true);
    setError('');
    setMensaje('');
    const guardadas = [];
    const fallidas = [];

    try {
      // Secuencial a propósito: una petición cada vez para no saturar Neon ni el servidor.
      for (const tarjeta of sugerencias) {
        const datos = {
          palabra: tarjeta.palabra.trim(),
          transliteracion: tarjeta.transliteracion.trim(),
          traduccion: tarjeta.traduccion.trim(),
          imagen_url: null,
          acento_posicion: tarjeta.acento_posicion === '' ? null : Number(tarjeta.acento_posicion),
          ejemplo_ruso: tarjeta.ejemplo_ruso.trim() || null,
          ejemplo_traduccion: tarjeta.ejemplo_traduccion.trim() || null,
          audio_url: null,
          nota_gramatical: tarjeta.nota_gramatical.trim() || null,
        };
        try {
          await crearTarjeta(leccionId, datos, token);
          guardadas.push(tarjeta);
        } catch (errorApi) {
          fallidas.push({
            id: tarjeta.id,
            palabra: tarjeta.palabra.trim(),
            mensaje: errorApi.message || 'error desconocido',
          });
        }
      }
    } finally {
      setGuardando(false);
    }

    // Solo quedan en pantalla las que fallaron; nunca se reenvían las ya guardadas.
    const idsFallidasActuales = new Set(fallidas.map((fallo) => fallo.id));
    setIdsFallidas([...idsFallidasActuales]);
    setSugerencias((anteriores) => anteriores.filter((tarjeta) => idsFallidasActuales.has(tarjeta.id)));

    if (guardadas.length) {
      setMensaje(
        `Se guardaron ${guardadas.length} tarjeta${guardadas.length === 1 ? '' : 's'}.` +
          (fallidas.length
            ? ` Quedan ${fallidas.length} por guardar; pulsa «Reintentar tarjetas fallidas».`
            : ''),
      );
      if (!fallidas.length) {
        if (entradaArchivo.current) entradaArchivo.current.value = '';
        setArchivo(null);
      }
      if (onGuardadas) {
        try {
          await onGuardadas();
        } catch {
          // La lista principal se recarga al volver a entrar en la lección.
        }
      }
    }
    if (fallidas.length) {
      setError(
        `No se guardaron ${fallidas.length} tarjeta${fallidas.length === 1 ? '' : 's'}. ` +
          fallidas.slice(0, 3).map((fallo) => `${fallo.palabra}: ${fallo.mensaje}`).join(' · '),
      );
    }
  };

  return (
    <div className="tarjeta formulario-contenedor">
      <h3>Generar tarjetas con IA desde un documento</h3>
      <p className="texto-suave texto-pequeno">
        Sube un PDF o DOCX del libro. Gemini propondrá tarjetas; revísalas y guárdalas solo cuando estén correctas.
      </p>
      <div className="campo">
        <label htmlFor="ia-documento">Documento (.pdf o .docx, máximo 5 MB)</label>
        <input
          id="ia-documento"
          ref={entradaArchivo}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={seleccionar}
        />
      </div>
      <div className="fila-acciones">
        <Boton onClick={generar} disabled={!archivo} cargando={generando}>
          Generar sugerencias
        </Boton>
        <Boton
          variante="exito"
          onClick={guardar}
          disabled={!sugerencias.length || incompletas}
          cargando={guardando}
        >
          {idsFallidas.length ? 'Reintentar tarjetas fallidas' : 'Guardar tarjetas revisadas'}
        </Boton>
      </div>
      {incompletas ? (
        <p className="texto-pequeno">Completa palabra, transliteración y traducción antes de guardar.</p>
      ) : null}
      {procesados ? <p className="texto-pequeno">Caracteres procesados: {procesados}.</p> : null}
      {error ? (
        <p className="aviso aviso--error" role="alert" aria-live="polite">{error}</p>
      ) : null}
      {mensaje ? (
        <p className="aviso aviso--info" role="status" aria-live="polite">{mensaje}</p>
      ) : null}

      {sugerencias.map((tarjeta, indice) => (
        <article className="tarjeta" key={tarjeta.id}>
          <div className="tarjeta-curso__cabecera">
            <h4>Sugerencia {indice + 1}</h4>
            <Boton variante="peligro" tamano="pequeno" onClick={() => descartar(tarjeta.id)}>
              Descartar
            </Boton>
          </div>
          <div className="rejilla-campos">
            <Campo
              id={`ia-palabra-${indice}`}
              etiqueta="Palabra (cirílico)"
              valor={tarjeta.palabra}
              onChange={cambiar(tarjeta.id, 'palabra')}
              requerido
            />
            <Campo
              id={`ia-transliteracion-${indice}`}
              etiqueta="Transliteración"
              valor={tarjeta.transliteracion}
              onChange={cambiar(tarjeta.id, 'transliteracion')}
              requerido
            />
            <Campo
              id={`ia-traduccion-${indice}`}
              etiqueta="Traducción"
              valor={tarjeta.traduccion}
              onChange={cambiar(tarjeta.id, 'traduccion')}
              requerido
            />
            <Campo
              id={`ia-acento-${indice}`}
              etiqueta="Posición del acento"
              tipo="number"
              min="0"
              max="199"
              valor={tarjeta.acento_posicion}
              onChange={cambiar(tarjeta.id, 'acento_posicion')}
            />
            <Campo
              id={`ia-ejemplo-ruso-${indice}`}
              etiqueta="Ejemplo en ruso"
              valor={tarjeta.ejemplo_ruso}
              onChange={cambiar(tarjeta.id, 'ejemplo_ruso')}
            />
            <Campo
              id={`ia-ejemplo-traduccion-${indice}`}
              etiqueta="Traducción del ejemplo"
              valor={tarjeta.ejemplo_traduccion}
              onChange={cambiar(tarjeta.id, 'ejemplo_traduccion')}
            />
          </div>
          <AreaTexto
            id={`ia-nota-${indice}`}
            etiqueta="Nota gramatical o contextual"
            valor={tarjeta.nota_gramatical}
            onChange={cambiar(tarjeta.id, 'nota_gramatical')}
            rows={2}
          />
        </article>
      ))}
    </div>
  );
}
