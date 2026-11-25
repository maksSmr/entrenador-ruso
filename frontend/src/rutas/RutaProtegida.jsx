import { Navigate, useLocation } from 'react-router-dom';
import ReenvioVerificacion from '../organismos/ReenvioVerificacion';
import { useAutenticacion } from '../hooks/useAutenticacion';

export default function RutaProtegida({ children, rol }) {
  const { token, usuario, cargando } = useAutenticacion();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="contenedor estado" role="status" aria-live="polite">
        <p>Comprobando tu sesión…</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  if (usuario && usuario.email_verificado === false) {
    return (
      <section className="seccion seccion--estrecha">
        <h1>Verifica tu correo</h1>
        <div className="tarjeta" role="status" aria-live="polite">
          <p>Tu cuenta todavía no está activa. Abre el enlace que enviamos a tu correo o solicita uno nuevo.</p>
          <ReenvioVerificacion
            email={usuario.email}
            compacto
            etiqueta="Reenviar correo de verificación"
          />
        </div>
      </section>
    );
  }

  if (rol && usuario && usuario.rol !== rol) {
    const destino = usuario.rol === 'maestro' ? '/panel-maestro' : '/panel-alumno';
    return <Navigate to={destino} replace />;
  }

  return children;
}
