import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Boton from '../atomos/Boton';
import Campo from '../atomos/Campo';
import { useAutenticacion } from '../hooks/useAutenticacion';

export default function FormularioLogin() {
  const { login } = useAutenticacion();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const referenciaMensaje = useRef(null);

  useEffect(() => {
    if (error && referenciaMensaje.current) {
      referenciaMensaje.current.focus();
    }
  }, [error]);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
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
      setError(
        errorApi.codigo === 'credenciales_invalidas'
          ? 'Correo o contraseña incorrectos. Inténtalo de nuevo.'
          : errorApi.message || 'No se pudo iniciar sesión.',
      );
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
      <Boton type="submit" cargando={cargando} className="boton--ancho">
        Entrar
      </Boton>
      <p className="texto-centro texto-pequeno">
        <Link to="/olvide-contrasena">¿Olvidaste tu contraseña?</Link>
      </p>
    </form>
  );
}
