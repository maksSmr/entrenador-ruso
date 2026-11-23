import { Route, Routes } from 'react-router-dom';
import RutaPorRol from './RutaPorRol';
import RutaProtegida from './RutaProtegida';

import Inicio from '../paginas/Inicio';
import Precios from '../paginas/Precios';
import Login from '../paginas/Login';
import Registro from '../paginas/Registro';
import RegistroMaestro from '../paginas/RegistroMaestro';
import RegistroAlumno from '../paginas/RegistroAlumno';
import VerificarCorreo from '../paginas/VerificarCorreo';
import OlvideContrasena from '../paginas/OlvideContrasena';
import RestablecerContrasena from '../paginas/RestablecerContrasena';
import PanelAlumno from '../paginas/PanelAlumno';
import CursoAlumno from '../paginas/CursoAlumno';
import Repaso from '../paginas/Repaso';
import Quiz from '../paginas/Quiz';
import Tarjetas from '../paginas/Tarjetas';
import MaestroPanel from '../paginas/MaestroPanel';
import MaestroCurso from '../paginas/MaestroCurso';
import MaestroPlan from '../paginas/MaestroPlan';
import PagoExitoso from '../paginas/PagoExitoso';
import Cursos from '../paginas/Cursos';
import Lecciones from '../paginas/Lecciones';
import HerramientasRuso from '../paginas/HerramientasRuso';
import NoEncontrado from '../paginas/NoEncontrado';

export default function Rutas() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/precios" element={<Precios />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro tipo="maestro" />} />
      <Route path="/registro-maestro" element={<RegistroMaestro />} />
      <Route path="/registro-alumno" element={<RegistroAlumno />} />
      <Route path="/verificar-correo" element={<VerificarCorreo />} />
      <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
      <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
      <Route path="/herramientas/ruso" element={<HerramientasRuso />} />
      <Route path="/pago-exitoso" element={<PagoExitoso />} />

      <Route
        path="/panel"
        element={
          <RutaPorRol rol="alumno">
            <PanelAlumno />
          </RutaPorRol>
        }
      />
      <Route
        path="/panel-alumno"
        element={
          <RutaPorRol rol="alumno">
            <PanelAlumno />
          </RutaPorRol>
        }
      />
      <Route
        path="/curso/:id"
        element={
          <RutaPorRol rol="alumno">
            <CursoAlumno />
          </RutaPorRol>
        }
      />
      <Route
        path="/repaso/:cursoId"
        element={
          <RutaPorRol rol="alumno">
            <Repaso />
          </RutaPorRol>
        }
      />
      <Route
        path="/cursos/:cursoId/repaso"
        element={
          <RutaPorRol rol="alumno">
            <Repaso />
          </RutaPorRol>
        }
      />
      <Route
        path="/quiz/:leccionId"
        element={
          <RutaPorRol rol="alumno">
            <Quiz />
          </RutaPorRol>
        }
      />
      <Route
        path="/lecciones/:id/quiz"
        element={
          <RutaPorRol rol="alumno">
            <Quiz />
          </RutaPorRol>
        }
      />

      <Route
        path="/maestro"
        element={
          <RutaPorRol rol="maestro">
            <MaestroPanel />
          </RutaPorRol>
        }
      />
      <Route
        path="/panel-maestro"
        element={
          <RutaPorRol rol="maestro">
            <MaestroPanel />
          </RutaPorRol>
        }
      />
      <Route
        path="/maestro/curso/:id"
        element={
          <RutaPorRol rol="maestro">
            <MaestroCurso />
          </RutaPorRol>
        }
      />
      <Route
        path="/maestro/plan"
        element={
          <RutaPorRol rol="maestro">
            <MaestroPlan />
          </RutaPorRol>
        }
      />
      <Route
        path="/planes"
        element={
          <RutaPorRol rol="maestro">
            <MaestroPlan />
          </RutaPorRol>
        }
      />

      <Route
        path="/cursos"
        element={
          <RutaProtegida>
            <Cursos />
          </RutaProtegida>
        }
      />
      <Route
        path="/cursos/:cursoId/lecciones"
        element={
          <RutaProtegida>
            <Lecciones />
          </RutaProtegida>
        }
      />
      <Route
        path="/lecciones/:id/tarjetas"
        element={
          <RutaProtegida>
            <Tarjetas />
          </RutaProtegida>
        }
      />

      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}
