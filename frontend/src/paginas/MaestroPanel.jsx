import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Insignia from '../atomos/Insignia';
import FormularioCurso from '../organismos/FormularioCurso';
import TarjetaCurso from '../moleculas/TarjetaCurso';
import { EstadoCarga, EstadoError, EstadoVacio } from '../moleculas/Estado';
import { useAutenticacion } from '../hooks/useAutenticacion';
import {
  crearCurso,
  eliminarCurso,
  listarAlumnos,
  listarCursos,
  miPlan,
  panelMaestro,
  regenerarCodigo,
} from '../servicios/api';
import { textoLimite } from '../utilidades/planes';

export default function MaestroPanel() {
  const { token, usuario } = useAutenticacion();
  const [cursos, setCursos] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [plan, setPlan] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');
  const [creando, setCreando] = useState(false);
  const [regenerando, setRegenerando] = useState(null);
  const [alumnos, setAlumnos] = useState(null);
  const [alumnosCurso, setAlumnosCurso] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [datosCursos, datosPanel, datosPlan] = await Promise.all([
        listarCursos(token),
        panelMaestro(token).catch(() => null),
        miPlan(token).catch(() => null),
      ]);
      setCursos(Array.isArray(datosCursos) ? datosCursos : []);
      setMetricas(datosPanel);
      setPlan(datosPlan);
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async (datos) => {
    setErrorFormulario('');
    setCreando(true);
    try {
      await crearCurso(datos, token);
      await cargar();
    } catch (errorApi) {
      setErrorFormulario(
        errorApi.codigo === 'limite_plan'
          ? 'Has alcanzado el límite de cursos de tu plan. Mejora tu plan para seguir creando.'
          : errorApi.message,
      );
    } finally {
      setCreando(false);
    }
  };

  const regenerar = async (id) => {
    setRegenerando(id);
    try {
      const cursoActualizado = await regenerarCodigo(id, token);
      setCursos((anteriores) => anteriores.map((curso) => (curso.id === id ? cursoActualizado : curso)));
    } catch (errorApi) {
      setErrorFormulario(errorApi.message);
    } finally {
      setRegenerando(null);
    }
  };

  const borrar = async (curso) => {
    if (!window.confirm(`¿Borrar el curso «${curso.nombre}»? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarCurso(curso.id, token);
      await cargar();
    } catch (errorApi) {
      setErrorFormulario(errorApi.message);
    }
  };

  const verAlumnos = async (curso) => {
    setAlumnosCurso(curso.nombre);
    setAlumnos(null);
    try {
      setAlumnos(await listarAlumnos(curso.id, token));
    } catch (errorApi) {
      setAlumnos({ error: errorApi.message });
    }
  };

  const limiteCursos = plan?.limites?.cursos;
  const usoCursos = plan?.uso?.cursos ?? cursos.length;
  const enLimite = limiteCursos !== null && limiteCursos !== undefined && usoCursos >= limiteCursos;

  return (
    <>
      <DocumentoTitulo
        titulo="Panel del maestro · Entrenador de ruso"
        descripcion="Gestiona tus cursos, alumnos y lecciones, y consulta el uso de tu plan."
      />
      <section className="seccion">
        <p className="eyebrow">Hola, {usuario?.nombre || 'maestro'}</p>
        <h1>Panel del maestro</h1>

        {cargando ? <EstadoCarga mensaje="Cargando tus cursos…" /> : null}
        {error ? <EstadoError mensaje={error} onReintentar={cargar} /> : null}

        {!cargando && !error ? (
          <>
            <div className="rejilla-metricas">
              <article className="tarjeta metrica">
                <span className="metrica__valor">{metricas?.cursos ?? cursos.length}</span>
                <span className="metrica__etiqueta">Cursos</span>
              </article>
              <article className="tarjeta metrica">
                <span className="metrica__valor">{metricas?.alumnos ?? 0}</span>
                <span className="metrica__etiqueta">Alumnos</span>
              </article>
              <article className="tarjeta metrica">
                <span className="metrica__valor">{metricas?.lecciones ?? 0}</span>
                <span className="metrica__etiqueta">Lecciones</span>
              </article>
              <article className="tarjeta metrica">
                <span className="metrica__valor">{metricas?.tarjetas ?? 0}</span>
                <span className="metrica__etiqueta">Tarjetas</span>
              </article>
            </div>

            {plan ? (
              <div className="tarjeta barra-plan">
                <div>
                  <Insignia tono={plan.plan === 'pro' ? 'ambar' : 'neutro'}>Plan {plan.nombre || plan.plan}</Insignia>
                  <p className="texto-pequeno">
                    {usoCursos}/{textoLimite(limiteCursos)} cursos · {plan.uso?.alumnos ?? 0}/
                    {textoLimite(plan.limites?.alumnos)} alumnos
                  </p>
                </div>
                <Link className="enlace-boton" to="/maestro/plan">
                  Gestionar plan
                </Link>
              </div>
            ) : null}

            {enLimite ? (
              <div className="aviso aviso--info" role="status">
                <p>Has llegado al límite de cursos de tu plan gratuito.</p>
                <Link className="enlace-boton" to="/maestro/plan">
                  Ver planes para ampliar
                </Link>
              </div>
            ) : null}

            <section aria-labelledby="crear-curso-titulo" className="seccion">
              <h2 id="crear-curso-titulo">Crear un curso</h2>
              <div className="tarjeta formulario-contenedor">
                <FormularioCurso onSubmit={crear} error={errorFormulario} cargando={creando} />
              </div>
            </section>

            <section aria-labelledby="mis-cursos-titulo" className="seccion">
              <h2 id="mis-cursos-titulo">Mis cursos</h2>
              {cursos.length === 0 ? (
                <EstadoVacio titulo="Aún no has creado cursos" mensaje="Empieza con el formulario de arriba." />
              ) : (
                <div className="rejilla-tres">
                  {cursos.map((curso) => (
                    <article key={curso.id} className="curso-con-acciones">
                      <TarjetaCurso
                        curso={curso}
                        esMaestro
                        onRegenerar={regenerar}
                        onVerAlumnos={verAlumnos}
                        regenerando={regenerando === curso.id}
                      />
                      <BotonEliminarCurso curso={curso} onBorrar={borrar} />
                    </article>
                  ))}
                </div>
              )}
            </section>

            {alumnosCurso ? (
              <section aria-labelledby="alumnos-titulo" className="seccion">
                <h2 id="alumnos-titulo">Alumnos de {alumnosCurso}</h2>
                {!alumnos ? <EstadoCarga mensaje="Cargando alumnos…" /> : null}
                {alumnos?.error ? <EstadoError mensaje={alumnos.error} /> : null}
                {Array.isArray(alumnos) && alumnos.length === 0 ? (
                  <EstadoVacio titulo="Todavía no hay alumnos" mensaje="Comparte el código de invitación del curso." />
                ) : null}
                {Array.isArray(alumnos) && alumnos.length ? (
                  <div className="tabla-contenedor">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Alumno</th>
                          <th scope="col">Correo</th>
                          <th scope="col">XP</th>
                          <th scope="col">Racha</th>
                          <th scope="col">Última actividad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnos.map((alumno) => (
                          <tr key={alumno.id}>
                            <td>{alumno.nombre}</td>
                            <td>{alumno.email}</td>
                            <td>{alumno.xp ?? 0}</td>
                            <td>{alumno.racha ?? 0}</td>
                            <td>
                              {alumno.ultima_actividad
                                ? new Date(alumno.ultima_actividad).toLocaleDateString('es-ES')
                                : 'Sin actividad'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            ) : null}
          </>
        ) : null}
      </section>
    </>
  );
}

function BotonEliminarCurso({ curso, onBorrar }) {
  return (
    <button type="button" className="enlace-sutil enlace-peligro" onClick={() => onBorrar(curso)}>
      🗑 Eliminar curso
    </button>
  );
}
