import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Insignia from '../atomos/Insignia';
import { PLANES, textoLimite } from '../utilidades/planes';

export default function Precios() {
  return (
    <>
      <DocumentoTitulo
        titulo="Planes y precios · Entrenador de ruso"
        descripcion="Compara el plan gratis y el plan pro: cursos, alumnos, tarjetas, quizzes y repaso espaciado."
      />
      <section className="seccion">
        <p className="eyebrow">Planes sencillos</p>
        <h1>Elige el plan para tu clase</h1>
        <p className="texto-suave">Empieza gratis y pasa a Pro cuando tu escuela crezca. Sin sorpresas.</p>
        <div className="rejilla-dos precios">
          {Object.entries(PLANES).map(([clave, plan]) => (
            <article className={`tarjeta plan ${clave === 'pro' ? 'plan--destacado' : ''}`} key={clave}>
              <div className="tarjeta-curso__cabecera">
                <h2>{plan.nombre}</h2>
                {clave === 'pro' ? <Insignia tono="ambar">Más popular</Insignia> : null}
              </div>
              <p className="plan__precio">{plan.precio}</p>
              <ul className="lista-check">
                {plan.caracteristicas.map((caracteristica) => (
                  <li key={caracteristica}>
                    <span aria-hidden="true">✓</span> {caracteristica}
                  </li>
                ))}
              </ul>
              <p className="texto-pequeno texto-suave">
                Límites: {textoLimite(plan.limites.cursos)} cursos · {textoLimite(plan.limites.alumnos)} alumnos
              </p>
              <Link className="boton boton--primario" to={clave === 'gratis' ? '/registro-maestro' : '/maestro/plan'}>
                {clave === 'gratis' ? 'Empezar gratis' : 'Ver mi plan'}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
