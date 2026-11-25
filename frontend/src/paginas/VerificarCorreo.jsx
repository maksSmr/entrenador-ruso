import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Boton from '../atomos/Boton';
import Campo from '../atomos/Campo';
import ReenvioVerificacion from '../organismos/ReenvioVerificacion';
import { verificarCorreo } from '../servicios/api';
import { EstadoCarga } from '../moleculas/Estado';

export default function VerificarCorreo() {
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const token = parametros.get('token');
  const [estado, setEstado] = useState(token ? 'verificando' : 'sin-token');
  const [email, setEmail] = useState('');
  const [emailEnviado, setEmailEnviado] = useState('');
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

  const enviarEmail = (evento) => {
    evento.preventDefault();
    if (email.trim()) setEmailEnviado(email.trim());
  };

  return (
    <>
      <DocumentoTitulo
        titulo="Verificar correo · Entrenador de ruso"
        descripcion="Confirma tu dirección de correo para activar tu cuenta en el Entrenador de ruso."
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
              <p>Este enlace ya no es válido. Escribe tu correo para recibir uno nuevo.</p>
              <form className="formulario" onSubmit={enviarEmail}>
                <Campo
                  id="verificar-email"
                  etiqueta="Correo electrónico"
                  tipo="email"
                  valor={email}
                  onChange={setEmail}
                  requerido
                />
                <Boton type="submit">Continuar</Boton>
              </form>
              {emailEnviado ? <ReenvioVerificacion email={emailEnviado} /> : null}
            </>
          ) : null}

          {estado === 'error' ? (
            <>
              <h2>⚠ No pudimos verificar tu correo</h2>
              <p>Ha ocurrido un problema al contactar con el servidor. Inténtalo de nuevo más tarde.</p>
              <Link className="enlace-boton" to="/login">
                Volver al inicio de sesión
              </Link>
            </>
          ) : null}

          {estado === 'sin-token' ? (
            <>
              <h2>⏳ Necesitas un enlace de verificación</h2>
              <p>Escribe tu correo y te enviaremos un enlace nuevo para activar tu cuenta.</p>
              <form className="formulario" onSubmit={enviarEmail}>
                <Campo
                  id="verificar-email"
                  etiqueta="Correo electrónico"
                  tipo="email"
                  valor={email}
                  onChange={setEmail}
                  requerido
                />
                <Boton type="submit">Continuar</Boton>
              </form>
              {emailEnviado ? <ReenvioVerificacion email={emailEnviado} /> : null}
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
