import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Insignia from '../atomos/Insignia';
import BarraProgreso from '../moleculas/BarraProgreso';
import { EstadoCarga, EstadoError, EstadoVacio } from '../moleculas/Estado';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { panelAlumno } from '../servicios/api';

export default function PanelAlumno() {
  const { token, usuario } = useAutenticacion();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setDatos(await panelAlumno(token));
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cursos = datos?.cursos || [];
  const pendientes = datos?.tarjetas_pendientes || [];
  const nivel = datos?.nivel ?? Math.floor((datos?.xp || 0) / 100) + 1;

  return (
    <>
      <DocumentoTitulo
        titulo="Mi panel · Entrenador de ruso"
        descripcion="Consulta tu XP, racha, nivel y las tarjetas que tienes pendientes de repasar hoy."
      />
      <section className="seccion">
        <p className="eyebrow">Hola, {usuario?.nombre || 'alumno'}</p>
        <h1>Mi panel de estudio</h1>

        {cargando ? <EstadoCarga mensaje="Cargando tu progreso…" /> : null}
        {error ? <EstadoError mensaje={error} onReintentar={cargar} /> : null}

        {!cargando && !error && datos ? (
          <>
            <div className="rejilla-metricas">
              <article className="tarjeta metrica">
                <span className="metrica__valor">{datos.xp || 0}</span>
                <span className="metrica__etiqueta">XP acumulados</span>
              </article>
              <article className="tarjeta metrica">
                <span className="metrica__valor">{datos.racha || 0} 🔥</span>
                <span className="metrica__etiqueta">Días de racha</span>
              </article>
              <article className="tarjeta metrica">
                <span className="metrica__valor">{nivel}</span>
                <span className="metrica__etiqueta">Nivel</span>
              </article>
              <article className="tarjeta metrica">
                <span className="metrica__valor">{pendientes.length || 0}</span>
                <span className="metrica__etiqueta">Tarjetas hoy</span>
              </article>
            </div>

            <div className="tarjeta">
              <BarraProgreso valor={(datos.xp || 0) % 100} maximo={100} etiqueta={`Progreso al nivel ${nivel + 1}`} />
              <p className="texto-pequeno texto-suave">
                Última actividad:{' '}
                {datos.ultima_actividad
                  ? new Date(datos.ultima_actividad).toLocaleDateString('es-ES')
                  : 'todavía no has estudiado'}
              </p>
              {typeof datos.promedio_aciertos === 'number' ? (
                <p className="texto-pequeno">Promedio de aciertos: {Math.round(datos.promedio_aciertos * 100)}%</p>
              ) : null}
            </div>

            <section aria-labelledby="mis-cursos-titulo" className="seccion">
              <h2 id="mis-cursos-titulo">Mis cursos</h2>
              {cursos.length === 0 ? (
                <EstadoVacio
                  titulo="Todavía no estás en ningún curso"
                  mensaje="Pídele el código de invitación a tu maestro y regístrate con él."
                >
                  <Link className="enlace-boton" to="/registro-alumno">
                    Unirme con un código
                  </Link>
                </EstadoVacio>
              ) : (
                <div className="rejilla-tres">
                  {Array.isArray(cursos) ? (
  cursos.map((curso) => {
    const id = curso.id || curso.curso_id;
    const totalPendientes = Number(curso.pendientes ?? curso.tarjetas_pendientes ?? 0);
    return (
      <article className="tarjeta" key={id}>
        <div className="tarjeta-curso__cabecera">
          <h3>{curso.nombre}</h3>
          <Insignia tono="indigo">{curso.idioma || 'Ruso'}</Insignia>
        </div>
        {totalPendientes ? (
          <p>{totalPendientes} tarjetas pendientes</p>
        ) : null}
      </article>
    );
  })
) : (
  <article className="tarjeta">
    <h3>Cursos inscritos: {cursos ?? 0}</h3>
  </article>
)}
                </div>
              )}
            </section>

            {pendientes.length ? (
              <section aria-labelledby="pendientes-titulo" className="seccion">
                <h2 id="pendientes-titulo">Tarjetas de hoy</h2>
                <ul className="lista-sencilla">
                  {pendientes.slice(0, 8).map((tarjeta) => (
                    <li key={tarjeta.id}>
                      <strong lang="ru">{tarjeta.palabra}</strong> · {tarjeta.traduccion}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {datos.quizzes?.length ? (
              <section aria-labelledby="quizzes-titulo" className="seccion">
                <h2 id="quizzes-titulo">Últimos quizzes</h2>
                <ul className="lista-sencilla">
                  {datos.quizzes.map((quiz, indice) => (
                    <li key={quiz.id || indice}>
                      {quiz.titulo || `Lección ${quiz.leccion_id}`}: {quiz.puntaje}/{quiz.total}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </section>
    </>
  );
}
