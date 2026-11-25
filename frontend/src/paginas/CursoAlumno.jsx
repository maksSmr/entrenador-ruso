import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Insignia from '../atomos/Insignia';
import BarraProgreso from '../moleculas/BarraProgreso';
import { EstadoCarga, EstadoError, EstadoVacio } from '../moleculas/Estado';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { listarLecciones, listarMisCursos } from '../servicios/api';

const DIAS_NUEVA = 7;

export function esNuevaDeLaClase(fechaAsignada, hoy = new Date()) {
  if (!fechaAsignada) return false;
  const fecha = new Date(fechaAsignada);
  if (Number.isNaN(fecha.getTime())) return false;
  const diferencia = hoy.getTime() - fecha.getTime();
  return diferencia >= 0 && diferencia <= DIAS_NUEVA * 24 * 60 * 60 * 1000;
}

export default function CursoAlumno() {
  const parametros = useParams();
  const id = parametros.id || parametros.cursoId;
  const { token } = useAutenticacion();
  const [curso, setCurso] = useState(null);
  const [lecciones, setLecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      // «/cursos/:id» es solo de maestro. El alumno saca el nombre de «/mis-cursos».
      const [datosCursos, datosLecciones] = await Promise.all([
        listarMisCursos(token),
        listarLecciones(id, token),
      ]);
      const cursos = Array.isArray(datosCursos) ? datosCursos : [];
      setCurso(cursos.find((curso) => String(curso.id) === String(id)) || null);
      setLecciones(Array.isArray(datosLecciones) ? datosLecciones : []);
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setCargando(false);
    }
  }, [id, token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <>
      <DocumentoTitulo
        titulo={`${curso?.nombre || 'Curso'} · Entrenador de ruso`}
        descripcion="Consulta las lecciones publicadas de tu curso y practica con quizzes y repaso espaciado."
      />
      <section className="seccion">
        <p className="eyebrow">Mi curso</p>
        <h1>{curso?.nombre || 'Lecciones del curso'}</h1>
        {curso?.descripcion ? <p className="texto-suave">{curso.descripcion}</p> : null}
        <div className="fila-acciones">
          {curso ? <Insignia tono="indigo">{curso.idioma || 'Ruso'}</Insignia> : null}
          <Link className="enlace-boton" to={`/repaso/${id}`}>
            Repasar pendientes de hoy
          </Link>
        </div>
        <p className="texto-suave texto-pequeno">
          El repaso diario muestra solo las tarjetas pendientes; «Practicar tarjetas» incluye todas las de la lección.
        </p>

        {cargando ? <EstadoCarga mensaje="Cargando lecciones…" /> : null}
        {error ? <EstadoError mensaje={error} onReintentar={cargar} /> : null}
        {!cargando && !error && lecciones.length === 0 ? (
          <EstadoVacio titulo="Aún no hay lecciones publicadas" mensaje="Tu maestro está preparando el contenido." />
        ) : null}

        {!cargando && !error && lecciones.length ? (
          <div className="lista-lecciones" aria-label="Lecciones publicadas">
            {lecciones.map((leccion) => {
              const porcentaje = leccion.porcentaje_avance ?? leccion.progreso ?? 0;
              return (
                <article className="tarjeta leccion" key={leccion.id}>
                  <div className="tarjeta-curso__cabecera">
                    <h2>{leccion.titulo}</h2>
                    {esNuevaDeLaClase(leccion.fecha_asignada) ? (
                      <Insignia tono="ambar">Nueva de la clase</Insignia>
                    ) : null}
                  </div>
                  {leccion.unidad_libro ? <Insignia tono="neutro">{leccion.unidad_libro}</Insignia> : null}
                  {leccion.descripcion ? <p className="texto-suave">{leccion.descripcion}</p> : null}
                  <BarraProgreso valor={porcentaje} maximo={100} etiqueta={`Avance en ${leccion.titulo}`} />
                  <div className="fila-acciones">
                    <Link className="enlace-boton" to={`/lecciones/${leccion.id}/tarjetas?practica=1`}>
                      Practicar tarjetas
                    </Link>
                    <Link className="enlace-sutil" to={`/lecciones/${leccion.id}/tarjetas`}>
                      Ver tarjetas
                    </Link>
                    <Link className="enlace-sutil" to={`/quiz/${leccion.id}`}>
                      Hacer quiz
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </>
  );
}
