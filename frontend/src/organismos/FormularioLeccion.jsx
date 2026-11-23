import { useEffect, useState } from 'react';
import Boton from '../atomos/Boton';
import Campo, { AreaTexto } from '../atomos/Campo';

function valoresIniciales(inicial) {
  return {
    titulo: inicial?.titulo || '',
    descripcion: inicial?.descripcion || '',
    orden: String(inicial?.orden ?? 1),
    publicada: Boolean(inicial?.publicada),
    unidad_libro: inicial?.unidad_libro || '',
    fecha_asignada: inicial?.fecha_asignada ? String(inicial.fecha_asignada).slice(0, 10) : '',
  };
}

export default function FormularioLeccion({ onSubmit, error, cargando = false, inicial }) {
  const [datos, setDatos] = useState(() => valoresIniciales(inicial));

  useEffect(() => {
    setDatos(valoresIniciales(inicial));
  }, [inicial]);

  const actualizar = (campo) => (valor) => setDatos((anterior) => ({ ...anterior, [campo]: valor }));

  const enviar = (evento) => {
    evento.preventDefault();
    if (!datos.titulo.trim()) return;
    onSubmit({
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      orden: Number(datos.orden) || 1,
      publicada: datos.publicada,
      unidad_libro: datos.unidad_libro.trim(),
      fecha_asignada: datos.fecha_asignada || null,
    });
    setDatos((anterior) => ({ ...anterior, titulo: '', descripcion: '', unidad_libro: '', fecha_asignada: '' }));
  };

  return (
    <form className="formulario" onSubmit={enviar}>
      <Campo id="leccion-titulo" etiqueta="Título de la lección" valor={datos.titulo} onChange={actualizar('titulo')} placeholder="Unidad 3: la familia" requerido />
      <AreaTexto id="leccion-descripcion" etiqueta="Descripción" valor={datos.descripcion} onChange={actualizar('descripcion')} rows={2} />
      <div className="rejilla-campos">
        <Campo id="leccion-orden" etiqueta="Orden" tipo="number" min="1" valor={datos.orden} onChange={actualizar('orden')} />
        <Campo id="leccion-unidad" etiqueta="Unidad del libro" valor={datos.unidad_libro} onChange={actualizar('unidad_libro')} placeholder="Unidad 3" />
        <Campo id="leccion-fecha" etiqueta="Fecha de asignación" tipo="date" valor={datos.fecha_asignada} onChange={actualizar('fecha_asignada')} />
      </div>
      <div className="casilla">
        <input
          id="leccion-publicada"
          type="checkbox"
          checked={datos.publicada}
          onChange={(evento) => actualizar('publicada')(evento.target.checked)}
        />
        <label htmlFor="leccion-publicada">Publicar para los alumnos</label>
      </div>
      {error ? (
        <p className="aviso aviso--error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      <Boton type="submit" cargando={cargando}>
        Guardar lección
      </Boton>
    </form>
  );
}
