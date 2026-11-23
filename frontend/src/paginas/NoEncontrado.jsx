import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';

export default function NoEncontrado() {
  return (
    <>
      <DocumentoTitulo
        titulo="Página no encontrada · Entrenador de ruso"
        descripcion="La página que buscas no existe en el Entrenador de ruso."
      />
      <section className="seccion seccion--estrecha estado">
        <p className="eyebrow">Error 404</p>
        <h1>No encontramos esta página</h1>
        <p className="texto-suave">Puede que el enlace esté mal escrito o que la página ya no exista.</p>
        <Link className="boton boton--primario" to="/">
          Volver al inicio
        </Link>
      </section>
    </>
  );
}
