import { Link, useSearchParams } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';

/** Ruta heredada por compatibilidad. El registro ya no pasa por aquí. */
export default function RevisarCorreo() {
  const [parametros] = useSearchParams();
  const correo = parametros.get('email') || '';

  return (
    <>
      <DocumentoTitulo
        titulo="Acceso directo · Entrenador de ruso"
        descripcion="Ya no hace falta revisar el correo para activar la cuenta."
      />
      <section className="seccion seccion--estrecha">
        <p className="eyebrow">Sin verificación</p>
        <h1>Ya puedes entrar</h1>
        <div className="tarjeta" role="status" aria-live="polite">
          <p>
            {correo ? (
              <>La cuenta de <strong>{correo}</strong> se activó al crearse.</>
            ) : (
              <>Tu cuenta se activó al crearse.</>
            )}
          </p>
          <p className="texto-suave texto-pequeno">
            No enviamos correos de confirmación. Si llegaste aquí desde un enlace antiguo, simplemente inicia sesión.
          </p>
          <div className="fila-acciones">
            <Link className="enlace-boton" to="/login">
              Iniciar sesión
            </Link>
            <Link className="enlace-sutil" to="/registro-alumno">
              Registrarme como alumno
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
