import { Link } from 'react-router-dom';

/** Aviso corto que se añade debajo del panel sin modificar PanelAlumno.jsx. */
export default function AccesoEstudioAlumno() {
  return (
    <section className="seccion" aria-labelledby="acceso-estudio-titulo">
      <div className="tarjeta">
        <p className="eyebrow">A practicar</p>
        <h2 id="acceso-estudio-titulo">Empieza a estudiar</h2>
        <p className="texto-suave">
          Entra en un curso para ver sus lecciones, practicar todas las tarjetas y hacer quizzes.
          También puedes repasar solo lo que tienes pendiente hoy.
        </p>
        <div className="fila-acciones">
          <Link className="enlace-boton" to="/estudiar">
            Ir a mis cursos
          </Link>
        </div>
      </div>
    </section>
  );
}
