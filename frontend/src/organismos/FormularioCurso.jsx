import { useState } from 'react';
import Boton from '../atomos/Boton';
import Campo, { AreaTexto } from '../atomos/Campo';

const IDIOMAS = ['Ruso', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Español'];

export default function FormularioCurso({ onSubmit, error, cargando = false }) {
  const [nombre, setNombre] = useState('');
  const [idioma, setIdioma] = useState('Ruso');
  const [descripcion, setDescripcion] = useState('');

  const enviar = (evento) => {
    evento.preventDefault();
    if (!nombre.trim()) return;
    onSubmit({ nombre: nombre.trim(), idioma, descripcion: descripcion.trim() });
    setNombre('');
    setDescripcion('');
  };

  return (
    <form className="formulario" onSubmit={enviar}>
      <Campo id="curso-nombre" etiqueta="Nombre del curso" valor={nombre} onChange={setNombre} placeholder="Ruso B1 · Grupo de tarde" requerido />
      <div className="campo">
        <label htmlFor="curso-idioma">Idioma</label>
        <select id="curso-idioma" name="idioma" value={idioma} onChange={(evento) => setIdioma(evento.target.value)}>
          {IDIOMAS.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </div>
      <AreaTexto id="curso-descripcion" etiqueta="Descripción" valor={descripcion} onChange={setDescripcion} rows={3} placeholder="Objetivos del curso, nivel, horario…" />
      {error ? (
        <p className="aviso aviso--error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      <Boton type="submit" cargando={cargando}>
        Crear curso
      </Boton>
    </form>
  );
}
