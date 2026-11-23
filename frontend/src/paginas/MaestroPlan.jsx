import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Boton from '../atomos/Boton';
import Insignia from '../atomos/Insignia';
import BarraProgreso from '../moleculas/BarraProgreso';
import { EstadoCarga, EstadoError } from '../moleculas/Estado';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { checkout, miPlan, portal } from '../servicios/api';
import { textoLimite } from '../utilidades/planes';

export default function MaestroPlan() {
  const { token } = useAutenticacion();
  const [plan, setPlan] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [accion, setAccion] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setPlan(await miPlan(token));
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirUrl = async (funcion, mensaje) => {
    setAccion('');
    try {
      const respuesta = await funcion(token);
      if (respuesta?.url) {
        window.location.href = respuesta.url;
      } else {
        setAccion(mensaje);
      }
    } catch (errorApi) {
      setError(errorApi.message);
    }
  };

  return (
    <>
      <DocumentoTitulo
        titulo="Mi plan · Entrenador de ruso"
        descripcion="Consulta el uso de tu plan, mejora a Pro o administra tu suscripción."
      />
      <section className="seccion seccion--estrecha">
        <p className="eyebrow">Suscripción</p>
        <h1>Mi plan</h1>
        {cargando ? <EstadoCarga mensaje="Cargando tu plan…" /> : null}
        {error ? <EstadoError mensaje={error} onReintentar={cargar} /> : null}
        {accion ? (
          <p className="aviso aviso--info" role="status" aria-live="polite">
            {accion}
          </p>
        ) : null}

        {!cargando && !error && plan ? (
          <>
            <div className="tarjeta">
              <div className="tarjeta-curso__cabecera">
                <h2>Plan {plan.nombre || plan.plan}</h2>
                <Insignia tono={plan.plan === 'pro' ? 'ambar' : 'neutro'}>
                  {plan.estado || 'activo'}
                </Insignia>
              </div>
              <BarraProgreso
                valor={plan.uso?.cursos ?? 0}
                maximo={plan.limites?.cursos || 1}
                etiqueta="Cursos"
              />
              <BarraProgreso
                valor={plan.uso?.alumnos ?? 0}
                maximo={plan.limites?.alumnos || 1}
                etiqueta="Alumnos"
              />
              <p className="texto-pequeno">
                {plan.uso?.cursos ?? 0} de {textoLimite(plan.limites?.cursos)} cursos ·{' '}
                {plan.uso?.alumnos ?? 0} de {textoLimite(plan.limites?.alumnos)} alumnos
              </p>
            </div>
            <div className="fila-acciones">
              <Boton onClick={() => abrirUrl(checkout, 'Se abrirá la página de pago.')}>
                Pasar a Pro
              </Boton>
              <Boton variante="secundario" onClick={() => abrirUrl(portal, 'Se abrirá el portal de gestión.')}>
                Administrar suscripción
              </Boton>
            </div>
            <p className="texto-pequeno texto-suave">
              Los pagos se procesan en modo de prueba con Stripe. No se guardan datos de tarjeta en esta app.
            </p>
            <Link className="enlace-sutil" to="/precios">
              Comparar planes
            </Link>
          </>
        ) : null}
      </section>
    </>
  );
}
