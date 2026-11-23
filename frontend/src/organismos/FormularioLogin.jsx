import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Boton from '../atomos/Boton';
import Campo from '../atomos/Campo';
import { useAutenticacion } from '../hooks/useAutenticacion';
import ReenvioVerificacion from './ReenvioVerificacion';

export default function FormularioLogin() {
  const { login } = useAutenticacion();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [correoSinVerificar, setCorreoSinVerificar] = useState('');
  const referenciaMensaje = useRef(null);

  useEffect(() => {
    if (error && referenciaMensaje.current) {
      referenciaMensaje.current.focus();
    }
  }, [error]);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
    setCorreoSinVerificar('');
    if (!email || !contrasena) {
      setError('Escribe tu correo y tu contraseña para continuar.');
      return;
    }
    setCargando(true);
    try {
      const datos = await login(email, contrasena);
      const rol = datos?.usuario?.rol;
      navegar(rol === 'maestro' ? '/panel-maestro' : '/panel-alumno', { replace: true });
    } catch (errorApi) {
      if (errorApi.codigo === 'correo_no_verificado') {
        setCorreoSinVerificar(email);
        setError('Tu correo todavía no está verificado. Revisa tu bandeja de entrada o solicita uno nuevo.');
      } else if (errorApi.codigo === 'credenciales_invalidas') {
        setError('Correo o contraseña incorrectos. Inténtalo de nuevo.');
      } else {
        setError(errorApi.message || 'No se pudo iniciar sesión.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <Campo
        id="login-email"
        etiqueta="Correo electrónico"
        tipo="email"
        valor={email}
        onChange={setEmail}
        autoComplete="email"
        placeholder="tu@correo.com"
        requerido
      />
      <Campo
        id="login-contrasena"
        etiqueta="Contraseña"
        tipo="password"
        valor={contrasena}
        onChange={setContrasena}
        autoComplete="current-password"
        requerido
      />
      <div aria-live="polite">
        {error ? (
          <p className="aviso aviso--error" role="alert" ref={referenciaMensaje} tabIndex={-1}>
            {error}
          </p>
        ) : null}
      </div>
      {correoSinVerificar ? <ReenvioVerificacion email={correoSinVerificar} compacto /> : null}
      <Boton type="submit" cargando={cargando} className="boton--ancho">
        Entrar
      </Boton>
      <p className="texto-centro texto-pequeno">
        <Link to="/olvide-contrasena">¿Olvidaste tu contraseña?</Link>
      </p>
    </form>
  );
}
