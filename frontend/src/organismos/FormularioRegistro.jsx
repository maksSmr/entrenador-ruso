import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Boton from '../atomos/Boton';
import Campo from '../atomos/Campo';
import { useAutenticacion } from '../hooks/useAutenticacion';
import ReenvioVerificacion from './ReenvioVerificacion';

export default function FormularioRegistro({ tipo = 'maestro' }) {
  const { registrar } = useAutenticacion();
  const navegar = useNavigate();
  const [datos, setDatos] = useState({ nombre: '', email: '', contrasena: '', codigo_invitacion: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState('');

  const actualizar = (campo) => (valor) => setDatos((anterior) => ({ ...anterior, [campo]: valor }));

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
    if (!datos.nombre || !datos.email || !datos.contrasena) {
      setError('Completa tu nombre, correo y contraseña.');
      return;
    }
    if (tipo === 'alumno' && !datos.codigo_invitacion) {
      setError('Necesitas el código de invitación de tu maestro.');
      return;
    }
    setCargando(true);
    try {
      await registrar(datos, tipo);
      setCorreoEnviado(datos.email);
    } catch (errorApi) {
      setError(
        errorApi.codigo === 'codigo_invalido'
          ? 'Ese código de invitación no es válido.'
          : errorApi.message || 'No se pudo completar el registro.',
      );
    } finally {
      setCargando(false);
    }
  };

  if (correoEnviado) {
    return (
      <div className="aviso aviso--exito" role="status" aria-live="polite">
        <h2>Revisa tu correo</h2>
        <p>
          Hemos enviado un enlace de verificación a <strong>{correoEnviado}</strong>. Ábrelo para activar tu
          cuenta y después inicia sesión.
        </p>
        <p className="texto-pequeno">¿No te ha llegado? Revisa la carpeta de spam o solicita uno nuevo.</p>
        <ReenvioVerificacion email={correoEnviado} />
        <Boton variante="secundario" onClick={() => navegar('/login')}>
          Ir a iniciar sesión
        </Boton>
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <Campo id="registro-nombre" etiqueta="Nombre completo" valor={datos.nombre} onChange={actualizar('nombre')} autoComplete="name" requerido />
      <Campo id="registro-email" etiqueta="Correo electrónico" tipo="email" valor={datos.email} onChange={actualizar('email')} autoComplete="email" requerido />
      <Campo
        id="registro-contrasena"
        etiqueta="Contraseña"
        tipo="password"
        valor={datos.contrasena}
        onChange={actualizar('contrasena')}
        ayuda="Mínimo 8 caracteres."
        autoComplete="new-password"
        requerido
      />
      {tipo === 'alumno' ? (
        <Campo
          id="registro-codigo"
          etiqueta="Código de invitación"
          valor={datos.codigo_invitacion}
          onChange={actualizar('codigo_invitacion')}
          ayuda="Pídeselo a tu maestro."
          requerido
        />
      ) : null}
      <div aria-live="polite">
        {error ? (
          <p className="aviso aviso--error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <Boton type="submit" cargando={cargando} className="boton--ancho">
        Crear cuenta de {tipo === 'maestro' ? 'maestro' : 'alumno'}
      </Boton>
    </form>
  );
}
