import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Boton from '../atomos/Boton';
import Campo from '../atomos/Campo';
import { useAutenticacion } from '../hooks/useAutenticacion';

export default function FormularioRegistro({ tipo = 'maestro' }) {
  const { registrar } = useAutenticacion();
  const navegar = useNavigate();
  const [datos, setDatos] = useState({ nombre: '', email: '', contrasena: '', codigo_invitacion: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

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
      const respuesta = await registrar(datos, tipo);
      if (respuesta?.token) {
        // El backend ya devuelve JWT: entramos directos en el panel del rol.
        const destino = tipo === 'alumno' || respuesta.usuario?.rol === 'alumno'
          ? '/panel-alumno'
          : '/panel-maestro';
        navegar(destino, { replace: true });
      } else {
        // Compatibilidad con un backend antiguo que aún pidiera verificación.
        navegar(`/revisar-correo?email=${encodeURIComponent(datos.email)}`, { replace: true });
      }
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
