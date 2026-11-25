import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import { verificarCorreo } from '../servicios/api';
import { EstadoCarga } from '../moleculas/Estado';

/** Página heredada: solo la usan enlaces antiguos. Ya no es obligatoria para entrar. */
export default function VerificarCorreo() {
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const token = parametros.get('token');
  const [estado, setEstado] = useState(token ? 'verificando' : 'sin-token');
  const referenciaMensaje = useRef(null);

  useEffect(() => {
    if (!token) return undefined;
    let activo = true;
    verificarCorreo(token)
      .then(() => activo && setEstado('exito'))
      .catch((errorApi) => {
        if (!activo) return;
        const codigo = (errorApi.codigo || errorApi.message || '').toLowerCase();
        const vencido =
          codigo.includes('vencid') || codigo.includes('expir') || codigo.includes('invalido') || codigo.includes('token');
        setEstado(vencido ? 'vencido' : 'error');
      });
    return () => {
      activo = false;
    };
  }, [token]);

  // Mostramos el éxito un momento y llevamos al login ya verificado.
  useEffect(() => {
    if (estado !== 'exito') return undefined;
    const temporizador = setTimeout(
      () => navegar('/login', { replace: true, state: { correoVerificado: true } }),
      2500,
    );
    return () => clearTimeout(temporizador);
  }, [estado, navegar]);

  useEffect(() => {
    if (referenciaMensaje.current) referenciaMensaje.current.focus();
  }, [estado]);

  return (
    <>
      <DocumentoTitulo
        titulo="Verificar correo · Entrenador de ruso"
        descripcion="Enlace heredado de la antigua verificación por correo."
      />
      <section className="seccion seccion--estrecha">
        <h1>Verificación de correo</h1>
        <div className="tarjeta" role="status" aria-live="polite" ref={referenciaMensaje} tabIndex={-1}>
          {estado === 'verificando' ? <EstadoCarga mensaje="Estamos verificando tu enlace…" /> : null}

          {estado === 'exito' ? (
            <>
              <h2>✅ Correo verificado</h2>
              <p>Tu cuenta ya está activa. Te llevamos al inicio de sesión en unos segundos.</p>
              <Link className="boton boton--primario" to="/login">
                Iniciar sesión
              </Link>
            </>
          ) : null}

          {estado === 'vencido' ? (
            <>
              <h2>⏳ El enlace ha vencido</h2>
              <p>Ese enlace antiguo ya no es válido. Hoy no hace falta verificar el correo: entra con tu contraseña.</p>
              <Link className="enlace-boton" to="/login">
                Ir al inicio de sesión
              </Link>
            </>
          ) : null}

          {estado === 'error' ? (
            <>
              <h2>⚠ No pudimos verificar tu correo</h2>
              <p>Ha ocurrido un problema al contactar con el servidor. Puedes entrar igualmente desde el login.</p>
              <Link className="enlace-boton" to="/login">
                Volver al inicio de sesión
              </Link>
            </>
          ) : null}

          {estado === 'sin-token' ? (
            <>
              <h2>Ya no necesitas un enlace de verificación</h2>
              <p>Las cuentas se activan al crearse. Entra directamente con tu correo y contraseña.</p>
              <Link className="enlace-boton" to="/login">
                Ir al inicio de sesión
              </Link>
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
