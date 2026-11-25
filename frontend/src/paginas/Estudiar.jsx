import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Insignia from '../atomos/Insignia';
import { EstadoCarga, EstadoError, EstadoVacio } from '../moleculas/Estado';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { listarMisCursos } from '../servicios/api';

/** Entrada de estudio del alumno: de aquí se entra a cada curso y a sus lecciones. */
export default function Estudiar() {
  const { token } = useAutenticacion();
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await listarMisCursos(token);
      setCursos(Array.isArray(datos) ? datos : []);
    } catch (errorApi) {
      setError(errorApi.message || 'No se pudieron cargar tus cursos.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <>
      <DocumentoTitulo
        titulo="Estudiar · Entrenador de ruso"
        descripcion="Elige uno de tus cursos para practicar todas las tarjetas, ver el vocabulario y hacer quizzes."
      />
      <section className="seccion">
        <p className="eyebrow">Tu estudio</p>
        <h1>Elige un curso para practicar</h1>
        <p className="texto-suave">
          Dentro de cada curso verás sus lecciones con tres acciones: practicar tarjetas, ver tarjetas y hacer quiz.
        </p>

        {cargando ? <EstadoCarga mensaje="Cargando tus cursos…" /> : null}
        {error ? <EstadoError mensaje={error} onReintentar={cargar} /> : null}
        {!cargando && !error && cursos.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no estás en ningún curso"
            mensaje="Pídele el código de invitación a tu maestro y regístrate con él."
          >
            <Link className="enlace-boton" to="/registro-alumno">
              Unirme con un código
            </Link>
          </EstadoVacio>
        ) : null}

        <div className="rejilla-tres">
          {cursos.map((curso) => {
            const id = curso.id || curso.curso_id;
            return (
              <article className="tarjeta" key={id}>
                <div className="tarjeta-curso__cabecera">
                  <h3>{curso.nombre}</h3>
                  <Insignia tono="indigo">{curso.idioma || 'Ruso'}</Insignia>
                </div>
                {curso.pendientes ? (
                  <p className="texto-pequeno">{curso.pendientes} tarjetas pendientes hoy</p>
                ) : null}
                <div className="fila-acciones">
                  <Link className="enlace-boton" to={`/curso/${id}`}>
                    Abrir curso
                  </Link>
                  <Link className="enlace-sutil" to={`/repaso/${id}`}>
                    Repasar hoy
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="texto-pequeno texto-suave">
          ¿Quieres ver tu progreso? <Link to="/panel">Ir a Mi panel</Link>.
        </p>
      </section>
    </>
  );
}
