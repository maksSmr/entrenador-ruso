import AccesoEstudioAlumno from '../organismos/AccesoEstudioAlumno';
import PanelAlumno from './PanelAlumno';

/** Compone el panel protegido con una entrada visible al estudio, sin tocar el panel original. */
export default function PanelAlumnoConAccesos() {
  return (
    <>
      <PanelAlumno />
      <AccesoEstudioAlumno />
    </>
  );
}
