import RutaProtegida from './RutaProtegida';

/** Exige sesión y un rol concreto ('maestro' o 'alumno'). */
export default function RutaPorRol({ rol, children }) {
  return <RutaProtegida rol={rol}>{children}</RutaProtegida>;
}
