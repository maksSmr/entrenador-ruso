import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Boton from '../atomos/Boton';
import Insignia from '../atomos/Insignia';
import FormularioLeccion from '../organismos/FormularioLeccion';
import FormularioTarjeta from '../organismos/FormularioTarjeta';
import { EstadoCarga, EstadoError, EstadoVacio } from '../moleculas/Estado';
import { useAutenticacion } from '../hooks/useAutenticacion';
import {
  actualizarLeccion,
  actualizarTarjeta,
  crearLeccion,
  crearTarjeta,
  eliminarLeccion,
  eliminarTarjeta,
  importarCsv,
  listarAlumnos,
  listarLecciones,
  listarTarjetas,
  obtenerCurso,
  regenerarCodigo,
  reporteMaestro,
} from '../servicios/api';

function leerFilas(archivo) {
  return new Promise((resolver) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result || '').split(/\r?\n/).filter(Boolean).slice(0, 6));
    lector.onerror = () => resolver([]);
    lector.readAsText(archivo, 'UTF-8');
  });
}

export default function MaestroCurso({ id: idProp }) {
  const parametros = useParams();
  const id = idProp || parametros.id || parametros.cursoId;
  const { token } = useAutenticacion();
  const [curso, setCurso] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [lecciones, setLecciones] = useState([]);
  const [reporte, setReporte] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [accion, setAccion] = useState('');
  const [leccionEditada, setLeccionEditada] = useState(null);
  const [leccionConTarjetas, setLeccionConTarjetas] = useState(null);
  const [tarjetas, setTarjetas] = useState([]);
  const [cargandoTarjetas, setCargandoTarjetas] = useState(false);
  const [tarjetaEditada, setTarjetaEditada] = useState(null);
  const [archivoCsv, setArchivoCsv] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState([]);
  const [resumenCsv, setResumenCsv] = useState(null);
  const [importando, setImportando] = useState(false);
  const archivoInput = useRef(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [datosCurso, datosAlumnos, datosLecciones, datosReporte] = await Promise.all([
        obtenerCurso(id, token),
        listarAlumnos(id, token).catch(() => []),
        listarLecciones(id, token),
        reporteMaestro(token).catch(() => []),
      ]);
      setCurso(datosCurso);
      setAlumnos(Array.isArray(datosAlumnos) ? datosAlumnos : []);
      setLecciones(Array.isArray(datosLecciones) ? datosLecciones : []);
      setReporte(Array.isArray(datosReporte) ? datosReporte : []);
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setCargando(false);
    }
  }, [id, token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cargarTarjetas = async (leccion) => {
    setLeccionConTarjetas(leccion);
    setCargandoTarjetas(true);
    setVistaPrevia([]);
    setResumenCsv(null);
    setTarjetaEditada(null);
    try {
      const datos = await listarTarjetas(leccion.id, token);
      setTarjetas(Array.isArray(datos) ? datos : []);
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setCargandoTarjetas(false);
    }
  };

  const copiarCodigo = async () => {
    if (!curso?.codigo_invitacion || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(curso.codigo_invitacion);
      setAccion('Código copiado al portapapeles.');
    } catch {
      setAccion('No se pudo copiar. Selecciona el código manualmente.');
    }
  };

  const regenerar = async () => {
    try {
      const actualizado = await regenerarCodigo(id, token);
      setCurso(actualizado);
      setAccion('Código de invitación regenerado.');
    } catch (errorApi) {
      setError(errorApi.message);
    }
  };

  const guardarLeccion = async (datos) => {
    setAccion('');
    try {
      if (leccionEditada) {
        await actualizarLeccion(leccionEditada.id, datos, token);
        setAccion('Lección actualizada.');
      } else {
        await crearLeccion(id, datos, token);
        setAccion('Lección creada.');
      }
      setLeccionEditada(null);
      await cargar();
    } catch (errorApi) {
      setError(errorApi.message);
    }
  };

  const alternarPublicada = async (leccion) => {
    try {
      await actualizarLeccion(leccion.id, { publicada: !leccion.publicada }, token);
      await cargar();
    } catch (errorApi) {
      setError(errorApi.message);
    }
  };

  const asignarClase = async (leccion) => {
    try {
      await actualizarLeccion(
        leccion.id,
        { publicada: true, fecha_asignada: new Date().toISOString() },
        token,
      );
      setAccion(`«${leccion.titulo}» asignada a la clase.`);
      await cargar();
    } catch (errorApi) {
      setError(errorApi.message);
    }
  };

  const borrarLeccion = async (leccion) => {
    if (!window.confirm(`¿Borrar la lección «${leccion.titulo}» y sus tarjetas?`)) return;
    try {
      await eliminarLeccion(leccion.id, token);
      if (leccionConTarjetas?.id === leccion.id) setLeccionConTarjetas(null);
      await cargar();
    } catch (errorApi) {
      setError(errorApi.message);
    }
  };

  const guardarTarjeta = async (datos) => {
    setAccion('');
    try {
      if (tarjetaEditada) {
        await actualizarTarjeta(tarjetaEditada.id, datos, token);
        setAccion('Tarjeta actualizada.');
      } else {
        await crearTarjeta(leccionConTarjetas.id, datos, token);
        setAccion('Tarjeta añadida.');
      }
      setTarjetaEditada(null);
      const actualizadas = await listarTarjetas(leccionConTarjetas.id, token);
      setTarjetas(Array.isArray(actualizadas) ? actualizadas : []);
      await cargar();
    } catch (errorApi) {
      setError(errorApi.message);
    }
  };

  const borrarTarjeta = async (tarjeta) => {
    if (!window.confirm(`¿Borrar la tarjeta «${tarjeta.palabra}»?`)) return;
    try {
      await eliminarTarjeta(tarjeta.id, token);
      const actualizadas = await listarTarjetas(leccionConTarjetas.id, token);
      setTarjetas(Array.isArray(actualizadas) ? actualizadas : []);
      await cargar();
    } catch (errorApi) {
      setError(errorApi.message);
    }
  };

  const seleccionarArchivo = async (evento) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    setArchivoCsv(archivo);
    setResumenCsv(null);
    setVistaPrevia(await leerFilas(archivo));
  };

  const importar = async () => {
    if (!archivoCsv || !leccionConTarjetas) return;
    setImportando(true);
    try {
      setResumenCsv(await importarCsv(leccionConTarjetas.id, archivoCsv, token));
      const actualizadas = await listarTarjetas(leccionConTarjetas.id, token);
      setTarjetas(Array.isArray(actualizadas) ? actualizadas : []);
      if (archivoInput.current) archivoInput.current.value = '';
      await cargar();
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setImportando(false);
    }
  };

  const inactivos = alumnos.filter((alumno) => {
    if (!alumno.ultima_actividad) return true;
    return Date.now() - new Date(alumno.ultima_actividad).getTime() > 7 * 24 * 60 * 60 * 1000;
  });

  return (
    <>
      <DocumentoTitulo
        titulo={`${curso?.nombre || 'Curso'} · Panel del maestro`}
        descripcion="Administra el código de invitación, los alumnos, las lecciones y las tarjetas de tu curso."
      />
      <section className="seccion">
        <p className="eyebrow">Detalle del curso</p>
        <h1>{curso?.nombre || 'Mi curso'}</h1>
        {accion ? (
          <p className="aviso aviso--info" role="status" aria-live="polite">
            {accion}
          </p>
        ) : null}

        {cargando ? <EstadoCarga mensaje="Cargando el curso…" /> : null}
        {error ? <EstadoError mensaje={error} onReintentar={cargar} /> : null}

        {!cargando && !error && curso ? (
          <>
            <section aria-labelledby="invitacion-titulo" className="seccion">
              <h2 id="invitacion-titulo">Invitación</h2>
              <div className="tarjeta codigo-invitacion">
                <div>
                  <span className="etiqueta-pequena">Código de invitación</span>
                  <code>{curso.codigo_invitacion}</code>
                </div>
                <div className="fila-acciones">
                  <Boton variante="secundario" onClick={copiarCodigo}>
                    Copiar código
                  </Boton>
                  <Boton variante="fantasma" onClick={regenerar}>
                    Regenerar código
                  </Boton>
                </div>
              </div>
            </section>

            <section aria-labelledby="alumnos-curso-titulo" className="seccion">
              <h2 id="alumnos-curso-titulo">Alumnos ({alumnos.length})</h2>
              {alumnos.length === 0 ? (
                <EstadoVacio titulo="Sin alumnos todavía" mensaje="Comparte el código de invitación con tu clase." />
              ) : (
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
              )}
            </section>

            <section aria-labelledby="lecciones-titulo" className="seccion">
              <h2 id="lecciones-titulo">Lecciones</h2>
              {lecciones.length === 0 ? (
                <EstadoVacio titulo="Todavía no hay lecciones" mensaje="Añade la primera lección con el formulario." />
              ) : (
                <div className="lista-lecciones">
                  {lecciones.map((leccion) => (
                    <article className="tarjeta leccion" key={leccion.id}>
                      <div className="tarjeta-curso__cabecera">
                        <h3>{leccion.titulo}</h3>
                        <Insignia tono={leccion.publicada ? 'verde' : 'neutro'}>
                          {leccion.publicada ? 'Publicada' : 'Borrador'}
                        </Insignia>
                      </div>
                      {leccion.unidad_libro ? <Insignia tono="indigo">{leccion.unidad_libro}</Insignia> : null}
                      {leccion.descripcion ? <p className="texto-suave">{leccion.descripcion}</p> : null}
                      {leccion.fecha_asignada ? (
                        <p className="texto-pequeno">
                          Asignada el {new Date(leccion.fecha_asignada).toLocaleDateString('es-ES')}
                        </p>
                      ) : null}
                      <div className="fila-acciones">
                        <Boton variante="secundario" tamano="pequeno" onClick={() => alternarPublicada(leccion)}>
                          {leccion.publicada ? 'Pasar a borrador' : 'Publicar'}
                        </Boton>
                        <Boton variante="exito" tamano="pequeno" onClick={() => asignarClase(leccion)}>
                          Asignar a la clase
                        </Boton>
                        <Boton variante="fantasma" tamano="pequeno" onClick={() => cargarTarjetas(leccion)}>
                          Editar tarjetas
                        </Boton>
                        <Boton variante="fantasma" tamano="pequeno" onClick={() => setLeccionEditada(leccion)}>
                          Editar
                        </Boton>
                        <Boton variante="peligro" tamano="pequeno" onClick={() => borrarLeccion(leccion)}>
                          Eliminar
                        </Boton>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="nueva-leccion-titulo" className="seccion">
              <h2 id="nueva-leccion-titulo">{leccionEditada ? 'Editar lección' : 'Nueva lección'}</h2>
              <div className="tarjeta formulario-contenedor">
                <FormularioLeccion
                  onSubmit={guardarLeccion}
                  error={error}
                  cargando={false}
                  key={leccionEditada?.id || 'nueva'}
                  inicial={leccionEditada}
                />
                {leccionEditada ? (
                  <Boton variante="secundario" onClick={() => setLeccionEditada(null)}>
                    Cancelar edición
                  </Boton>
                ) : null}
              </div>
            </section>

            {leccionConTarjetas ? (
              <section aria-labelledby="tarjetas-titulo" className="seccion">
                <h2 id="tarjetas-titulo">Tarjetas de «{leccionConTarjetas.titulo}»</h2>
                {cargandoTarjetas ? <EstadoCarga mensaje="Cargando tarjetas…" /> : null}
                {!cargandoTarjetas && tarjetas.length === 0 ? (
                  <EstadoVacio titulo="Sin tarjetas" mensaje="Añade tarjetas o importa un CSV." />
                ) : null}
                <ul className="lista-sencilla">
                  {tarjetas.map((tarjeta) => (
                    <li key={tarjeta.id}>
                      <strong lang="ru">{tarjeta.palabra}</strong> · {tarjeta.transliteracion} ·{' '}
                      {tarjeta.traduccion}
                      <span className="fila-acciones">
                        <Boton variante="fantasma" tamano="pequeno" onClick={() => setTarjetaEditada(tarjeta)}>
                          Editar
                        </Boton>
                        <Boton variante="peligro" tamano="pequeno" onClick={() => borrarTarjeta(tarjeta)}>
                          Eliminar
                        </Boton>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="tarjeta formulario-contenedor">
                  <h3>{tarjetaEditada ? 'Editar tarjeta' : 'Añadir tarjeta'}</h3>
                  <FormularioTarjeta
                    inicial={tarjetaEditada}
                    onSubmit={guardarTarjeta}
                    onCancelar={tarjetaEditada ? () => setTarjetaEditada(null) : undefined}
                    error={error}
                  />
                </div>

                <div className="tarjeta formulario-contenedor">
                  <h3>Importar tarjetas desde CSV</h3>
                  <p className="texto-suave texto-pequeno">
                    Cabeceras: <code>palabra,transliteracion,traduccion</code>. Máximo 500 filas.
                  </p>
                  <a href="/plantilla-tarjetas.csv" download="plantilla-tarjetas.csv">
                    Descargar plantilla CSV de ejemplo
                  </a>
                  <div className="campo">
                    <label htmlFor="csv-archivo">Archivo CSV</label>
                    <input
                      id="csv-archivo"
                      ref={archivoInput}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={seleccionarArchivo}
                    />
                  </div>
                  {vistaPrevia.length ? (
                    <div>
                      <h4>Vista previa (primeras filas)</h4>
                      <div className="tabla-contenedor">
                        <table>
                          <tbody>
                            {vistaPrevia.map((fila, indice) => (
                              <tr key={indice}>
                                {fila.split(',').map((celda, indiceCelda) => (
                                  <td key={indiceCelda}>{celda}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                  <Boton onClick={importar} disabled={!archivoCsv} cargando={importando}>
                    Importar CSV
                  </Boton>
                  {resumenCsv ? (
                    <div className="aviso aviso--info" role="status" aria-live="polite">
                      <p>
                        Importadas: {resumenCsv.importadas} · Omitidas: {resumenCsv.omitidas}
                      </p>
                      {resumenCsv.razones?.length ? (
                        <ul>
                          {resumenCsv.razones.slice(0, 10).map((razon, indice) => (
                            <li key={indice}>{typeof razon === 'string' ? razon : JSON.stringify(razon)}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section aria-labelledby="reporte-titulo" className="seccion">
              <h2 id="reporte-titulo">Reporte para la próxima clase</h2>
              {reporte.length === 0 ? (
                <EstadoVacio titulo="Sin datos aún" mensaje="El reporte aparece cuando los alumnos empiecen a practicar." />
              ) : (
                <div className="tabla-contenedor">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Unidad</th>
                        <th scope="col">Lección</th>
                        <th scope="col">Intentos</th>
                        <th scope="col">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.map((fila, indice) => (
                        <tr key={indice}>
                          <td>{fila.unidad_libro || '—'}</td>
                          <td>{fila.leccion || '—'}</td>
                          <td>{fila.intentos ?? 0}</td>
                          <td>{fila.promedio == null ? '—' : `${Math.round(Number(fila.promedio) * 100)}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {inactivos.length ? (
                <p className="aviso aviso--info">
                  Alumnos sin actividad en 7 días: {inactivos.map((alumno) => alumno.nombre).join(', ')}
                </p>
              ) : null}
            </section>

            <Link className="enlace-boton" to="/maestro">
              Volver a mis cursos
            </Link>
          </>
        ) : null}
      </section>
    </>
  );
}
