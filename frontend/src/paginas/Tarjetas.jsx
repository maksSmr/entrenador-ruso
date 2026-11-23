import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import { EstadoCarga, EstadoError, EstadoVacio } from '../moleculas/Estado';
import TarjetaPalabra from '../moleculas/TarjetaPalabra';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { listarTarjetas } from '../servicios/api';

export default function Tarjetas() {
  const { id } = useParams();
  const { token, usuario } = useAutenticacion();
  const [tarjetas, setTarjetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const esMaestro = usuario?.rol === 'maestro';

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await listarTarjetas(id, token);
      setTarjetas(Array.isArray(datos) ? datos : []);
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
        titulo="Tarjetas de la lección · Entrenador de ruso"
        descripcion="Consulta el vocabulario de la lección con transliteración, traducción y audio."
      />
      <section className="seccion">
        <p className="eyebrow">Vocabulario</p>
        <h1>Tarjetas de la lección</h1>
        {esMaestro ? (
          <p className="texto-suave">
            Para editar estas tarjetas, abre el{' '}
            <Link to="/maestro">detalle del curso en tu panel</Link>.
          </p>
        ) : null}
        {cargando ? <EstadoCarga mensaje="Cargando tarjetas…" /> : null}
        {error ? <EstadoError mensaje={error} onReintentar={cargar} /> : null}
        {!cargando && !error && tarjetas.length === 0 ? (
          <EstadoVacio titulo="Esta lección no tiene tarjetas" />
        ) : null}
        <div className="rejilla-tres">
          {tarjetas.map((tarjeta) => (
            <TarjetaPalabra key={tarjeta.id} tarjeta={tarjeta} />
          ))}
        </div>
      </section>
    </>
  );
}
