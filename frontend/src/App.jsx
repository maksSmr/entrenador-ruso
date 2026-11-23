import { Link } from 'react-router-dom';
import Encabezado from './organismos/Encabezado';
import Rutas from './rutas/Rutas';

export default function App() {
  return (
    <div className="app">
      <a className="salto-contenido" href="#contenido-principal">
        Saltar al contenido
      </a>
      <Encabezado />
      <main id="contenido-principal" tabIndex={-1}>
        <Rutas />
      </main>
      <footer className="pie">
        <div className="contenedor pie__interno">
          <p>© {new Date().getFullYear()} Entrenador de ruso · Hecho para maestros de idiomas.</p>
          <nav aria-label="Enlaces del pie de página">
            <Link to="/precios">Planes</Link>
            <Link to="/herramientas/ruso">Herramientas</Link>
            <Link to="/login">Entrar</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
