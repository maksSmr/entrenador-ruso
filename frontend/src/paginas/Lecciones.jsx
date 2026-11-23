import { useParams } from 'react-router-dom';
import { useAutenticacion } from '../hooks/useAutenticacion';
import CursoAlumno from './CursoAlumno';
import MaestroCurso from './MaestroCurso';

/** Alias histórico /cursos/:cursoId/lecciones según el rol. */
export default function Lecciones() {
  const { cursoId } = useParams();
  const { usuario } = useAutenticacion();
  return usuario?.rol === 'maestro' ? <MaestroCurso id={cursoId} /> : <CursoAlumno />;
}
