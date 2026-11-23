import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../hooks/useAutenticacion';
import Boton from '../atomos/Boton';
import Insignia from '../atomos/Insignia';

export default function Encabezado() {
  const { usuario, autenticado, cerrarSesion } = useAutenticacion();
  const navegar = useNavigate();
  const esMaestro = usuario?.rol === 'maestro';

  const salir = () => {
    cerrarSesion();
    navegar('/');
  };

  return (
    <header className="encabezado">
      <div className="encabezado__interno contenedor">
        <Link to="/" className="marca" aria-label="Ir al inicio">
          <span className="marca__simbolo" aria-hidden="true">
            Я
          </span>
          <span>
            <strong>Entrenador de ruso</strong>
            <small>Para maestros y sus alumnos</small>
          </span>
        </Link>

        <nav className="navegacion" aria-label="Navegación principal">
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/herramientas/ruso">Herramientas</NavLink>
          {autenticado ? (
            <>
              <NavLink to={esMaestro ? '/panel-maestro' : '/panel-alumno'}>Mi panel</NavLink>
              {esMaestro ? <NavLink to="/planes">Planes</NavLink> : null}
            </>
          ) : (
            <>
              <NavLink to="/login">Entrar</NavLink>
              <NavLink to="/registro">Registro</NavLink>
            </>
          )}
        </nav>

        <div className="encabezado__usuario">
          {autenticado ? (
            <>
              <Insignia tono={esMaestro ? 'indigo' : 'verde'}>
                {esMaestro ? 'Maestro' : 'Alumno'}
              </Insignia>
              <span className="encabezado__nombre">{usuario?.nombre || 'Mi cuenta'}</span>
              <Boton variante="secundario" tamano="pequeno" onClick={salir}>
                Salir
              </Boton>
            </>
          ) : (
            <Link className="enlace-boton" to="/registro">
              Empezar gratis
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
