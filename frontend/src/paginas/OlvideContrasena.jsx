import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Boton from '../atomos/Boton';
import Campo from '../atomos/Campo';
import { olvideContrasena } from '../servicios/api';

export default function OlvideContrasena() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const referencia = useRef(null);

  const enviar = async (evento) => {
    evento.preventDefault();
    setCargando(true);
    setMensaje('');
    try {
      await olvideContrasena(email);
      setMensaje('Si el correo existe, te hemos enviado un enlace para restablecer la contraseña.');
    } catch (errorApi) {
      setMensaje(errorApi.message || 'No se pudo enviar el enlace. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
      setTimeout(() => referencia.current && referencia.current.focus(), 0);
    }
  };

  return (
    <>
      <DocumentoTitulo
        titulo="Olvidé mi contraseña · Entrenador de ruso"
        descripcion="Recibe un enlace para restablecer la contraseña de tu cuenta del Entrenador de ruso."
      />
      <section className="seccion seccion--estrecha">
        <h1>Recupera tu contraseña</h1>
        <div className="tarjeta">
          <form className="formulario" onSubmit={enviar}>
            <Campo id="olvide-email" etiqueta="Correo electrónico" tipo="email" valor={email} onChange={setEmail} requerido />
            <Boton type="submit" cargando={cargando}>
              Enviar enlace
            </Boton>
          </form>
          <p ref={referencia} className="aviso aviso--info" role="status" aria-live="polite" tabIndex={-1}>
            {mensaje}
          </p>
          <Link className="enlace-sutil" to="/login">
            Volver al inicio de sesión
          </Link>
        </div>
      </section>
    </>
  );
}
