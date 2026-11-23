import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Boton from '../atomos/Boton';
import Campo from '../atomos/Campo';
import { restablecerContrasena } from '../servicios/api';

export default function RestablecerContrasena() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') || '';
  const [contrasena, setContrasena] = useState('');
  const [repeticion, setRepeticion] = useState('');
  const [estado, setEstado] = useState('formulario');
  const [mensaje, setMensaje] = useState('');
  const referencia = useRef(null);

  useEffect(() => {
    if (!token) {
      setMensaje('El enlace no incluye un token válido. Solicita uno nuevo.');
      referencia.current && referencia.current.focus();
    }
  }, [token]);

  const enviar = async (evento) => {
    evento.preventDefault();
    setMensaje('');
    if (contrasena.length < 8) {
      setMensaje('La contraseña debe tener al menos 8 caracteres.');
      referencia.current && referencia.current.focus();
      return;
    }
    if (contrasena !== repeticion) {
      setMensaje('Las contraseñas no coinciden.');
      referencia.current && referencia.current.focus();
      return;
    }
    try {
      await restablecerContrasena(token, contrasena);
      setEstado('exito');
    } catch (errorApi) {
      setMensaje(errorApi.message || 'No se pudo cambiar la contraseña.');
    }
    setTimeout(() => referencia.current && referencia.current.focus(), 0);
  };

  return (
    <>
      <DocumentoTitulo
        titulo="Restablecer contraseña · Entrenador de ruso"
        descripcion="Elige una nueva contraseña para tu cuenta del Entrenador de ruso."
      />
      <section className="seccion seccion--estrecha">
        <h1>Nueva contraseña</h1>
        <div className="tarjeta" ref={referencia} tabIndex={-1} role="status" aria-live="polite">
          {estado === 'formulario' ? (
            <form className="formulario" onSubmit={enviar}>
              <Campo
                id="nueva-contrasena"
                etiqueta="Nueva contraseña"
                tipo="password"
                valor={contrasena}
                onChange={setContrasena}
                ayuda="Mínimo 8 caracteres."
                autoComplete="new-password"
                requerido
              />
              <Campo
                id="repetir-contrasena"
                etiqueta="Repite la contraseña"
                tipo="password"
                valor={repeticion}
                onChange={setRepeticion}
                autoComplete="new-password"
                requerido
              />
              <Boton type="submit" disabled={!token}>
                Guardar contraseña
              </Boton>
            </form>
          ) : (
            <>
              <h2>✅ Contraseña actualizada</h2>
              <p>Ya puedes entrar con tu nueva contraseña.</p>
              <Link className="boton boton--primario" to="/login">
                Iniciar sesión
              </Link>
            </>
          )}
          {mensaje ? (
            <p className="aviso aviso--error" role="alert">
              {mensaje}
            </p>
          ) : null}
          {!token ? <Link className="enlace-sutil" to="/olvide-contrasena">Pedir un enlace nuevo</Link> : null}
        </div>
      </section>
    </>
  );
}
