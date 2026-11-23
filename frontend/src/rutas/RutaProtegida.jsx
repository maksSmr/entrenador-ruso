import { Navigate, useLocation } from 'react-router-dom';
import { useAutenticacion } from '../hooks/useAutenticacion';

export default function RutaProtegida({ children, rol }) {
  const { token, usuario, cargando } = useAutenticacion();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="contenedor estado" role="status" aria-live="polite">
        <p>Comprobando tu sesión…</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  if (rol && usuario && usuario.rol !== rol) {
    const destino = usuario.rol === 'maestro' ? '/panel-maestro' : '/panel-alumno';
    return <Navigate to={destino} replace />;
  }

  return children;
}
