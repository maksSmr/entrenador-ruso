import { Navigate } from 'react-router-dom';
import { useAutenticacion } from '../hooks/useAutenticacion';

/** Alias histórico: lleva a cada rol a su panel. */
export default function Cursos() {
  const { usuario } = useAutenticacion();
  return <Navigate to={usuario?.rol === 'maestro' ? '/maestro' : '/panel'} replace />;
}
