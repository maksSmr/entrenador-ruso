import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import FormularioRegistro from '../organismos/FormularioRegistro';

export default function Registro({ tipo = 'maestro' }) {
  const esMaestro = tipo === 'maestro';
  return (
    <>
      <DocumentoTitulo
        titulo={esMaestro ? 'Registro de maestro · Entrenador de ruso' : 'Registro de alumno · Entrenador de ruso'}
        descripcion={
          esMaestro
            ? 'Crea tu cuenta de maestro y organiza tus cursos de idiomas con tarjetas y repaso espaciado.'
            : 'Regístrate como alumno con el código de invitación de tu maestro y empieza a practicar ruso.'
        }
      />
      <section className="seccion seccion--estrecha">
        <p className="eyebrow">{esMaestro ? 'Para docentes' : 'Para estudiantes'}</p>
        <h1>{esMaestro ? 'Crea tu cuenta de maestro' : 'Únete a la clase de tu maestro'}</h1>
        <p className="texto-suave">
          {esMaestro
            ? 'Gratis para empezar. Podrás invitar hasta 10 alumnos y crear 2 cursos.'
            : 'Necesitas el código de invitación que te dé tu maestro para registrarte.'}
        </p>
        <div className="tarjeta formulario-contenedor">
          <FormularioRegistro tipo={tipo} />
        </div>
        <p className="texto-centro texto-pequeno">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          {esMaestro ? (
            <>
              {' · '}
              <Link to="/registro-alumno">Soy alumno</Link>
            </>
          ) : (
            <>
              {' · '}
              <Link to="/registro-maestro">Soy maestro</Link>
            </>
          )}
        </p>
      </section>
    </>
  );
}
