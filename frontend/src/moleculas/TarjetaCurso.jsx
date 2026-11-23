import { Link } from 'react-router-dom';
import Boton from '../atomos/Boton';
import Insignia from '../atomos/Insignia';

export default function TarjetaCurso({
  curso,
  esMaestro = false,
  onRegenerar,
  onVerAlumnos,
  regenerando = false,
}) {
  const codigo = curso.codigo_invitacion;

  const copiar = async () => {
    if (!codigo || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(codigo);
    } catch {
      // El navegador puede denegar el acceso al portapapeles.
    }
  };

  return (
    <article className="tarjeta tarjeta-curso">
      <div className="tarjeta-curso__cabecera">
        <h3>{curso.nombre}</h3>
        <Insignia tono="indigo">{curso.idioma || 'Ruso'}</Insignia>
      </div>
      {curso.descripcion ? <p className="texto-suave">{curso.descripcion}</p> : null}
      {curso.inscrito_en ? (
        <p className="texto-suave texto-pequeno">Inscrito el {new Date(curso.inscrito_en).toLocaleDateString('es-ES')}</p>
      ) : null}
      {esMaestro && codigo ? (
        <div className="codigo-invitacion">
          <div>
            <span className="etiqueta-pequena">Código de invitación</span>
            <code>{codigo}</code>
          </div>
          <div className="fila-acciones">
            <Boton variante="secundario" tamano="pequeno" onClick={copiar}>
              Copiar
            </Boton>
            {onRegenerar ? (
              <Boton variante="fantasma" tamano="pequeno" onClick={() => onRegenerar(curso.id)} cargando={regenerando}>
                Regenerar
              </Boton>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="fila-acciones tarjeta-curso__acciones">
        {esMaestro ? (
          <>
            <Link className="enlace-boton" to={`/cursos/${curso.id}/lecciones`}>
              Ver lecciones
            </Link>
            {onVerAlumnos ? (
              <button type="button" className="enlace-sutil" onClick={() => onVerAlumnos(curso)}>
                Alumnos
              </button>
            ) : null}
          </>
        ) : (
          <>
            <Link className="enlace-boton" to={`/cursos/${curso.id}/lecciones`}>
              Estudiar
            </Link>
            <Link className="enlace-sutil" to={`/cursos/${curso.id}/repaso`}>
              Repasar hoy
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
