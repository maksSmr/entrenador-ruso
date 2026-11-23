import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';

export default function Inicio() {
  return (
    <>
      <DocumentoTitulo
        titulo="Entrenador de ruso · Tu clase, en orden"
        descripcion="Crea cursos, invita a tus alumnos y haz que practiquen con tarjetas, audio, quizzes y repaso espaciado."
      />
      <section className="hero">
        <div className="hero__contenido">
          <p className="eyebrow">Para maestros de idiomas</p>
          <h1>Tu clase de ruso, organizada y en práctica constante</h1>
          <p className="hero__texto">
            Crea tus cursos, comparte un código de invitación y deja que tus alumnos practiquen con tarjetas,
            audio, quizzes y repaso espaciado. Todo en español, pensado para hispanohablantes.
          </p>
          <div className="fila-acciones hero__acciones">
            <Link className="boton boton--primario" to="/registro-maestro">
              Soy maestro
            </Link>
            <Link className="boton boton--secundario" to="/registro-alumno">
              Soy alumno
            </Link>
            <Link className="enlace-sutil" to="/precios">
              Ver planes y precios
            </Link>
          </div>
        </div>
        <div className="hero__ilustracion" aria-hidden="true">
          <div className="tarjeta-demo">
            <span>привет</span>
            <small>privet · hola</small>
          </div>
          <div className="tarjeta-demo tarjeta-demo--secundaria">
            <span>репасо</span>
            <small>5 cajas · 20 tarjetas hoy</small>
          </div>
        </div>
      </section>

      <section className="seccion" aria-labelledby="como-funciona">
        <h2 id="como-funciona">¿Cómo funciona?</h2>
        <div className="rejilla-tres">
          <article className="tarjeta">
            <span className="paso">1</span>
            <h3>Crea tu curso</h3>
            <p>Define el nombre, el idioma y las unidades del libro que vas a trabajar en clase.</p>
          </article>
          <article className="tarjeta">
            <span className="paso">2</span>
            <h3>Invita a tus alumnos</h3>
            <p>Comparte el código de invitación. Cada maestro ve solo sus cursos y sus alumnos.</p>
          </article>
          <article className="tarjeta">
            <span className="paso">3</span>
            <h3>Ellos practican solos</h3>
            <p>Flashcards con audio, quizzes y repaso espaciado de 5 cajas. Tú ves el progreso.</p>
          </article>
        </div>
      </section>

      <section className="seccion" aria-labelledby="herramientas-titulo">
        <h2 id="herramientas-titulo">Pensado para el cirílico</h2>
        <div className="rejilla-dos">
          <article className="tarjeta">
            <h3>Entrenador del alfabeto</h3>
            <p> Las 33 letras agrupadas por dificultad, acento tónico y teclado cirílico en pantalla.</p>
            <Link className="enlace-boton" to="/herramientas/ruso">
              Abrir herramientas
            </Link>
          </article>
          <article className="tarjeta">
            <h3>Progreso que se ve</h3>
            <p>XP, racha diaria, nivel y tarjetas pendientes para cada alumno y cada curso.</p>
            <Link className="enlace-boton" to="/login">
              Entrar a mi cuenta
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}
