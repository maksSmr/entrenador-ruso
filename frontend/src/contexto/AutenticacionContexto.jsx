import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as api from '../servicios/api';

export const AutenticacionContexto = createContext(null);

const CLAVE_TOKEN = 'token';

export function ProveedorAutenticacion({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  });
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(localStorage.getItem(CLAVE_TOKEN)));
  const [error, setError] = useState(null);

  const guardarToken = useCallback((nuevoToken) => {
    try {
      if (nuevoToken) {
        localStorage.setItem(CLAVE_TOKEN, nuevoToken);
      } else {
        localStorage.removeItem(CLAVE_TOKEN);
      }
    } catch {
      // Entorno sin localStorage: seguimos con el estado en memoria.
    }
    setToken(nuevoToken);
  }, []);

  const recargar = useCallback(
    async (tokenUsado = token) => {
      if (!tokenUsado) {
        setUsuario(null);
        setCargando(false);
        return null;
      }
      setCargando(true);
      try {
        const datos = await api.yo(tokenUsado);
        setUsuario(datos);
        setError(null);
        return datos;
      } catch (errorApi) {
        guardarToken(null);
        setUsuario(null);
        setError(errorApi.message);
        return null;
      } finally {
        setCargando(false);
      }
    },
    [guardarToken, token],
  );

  useEffect(() => {
    const tokenInicial = token;
    if (tokenInicial) {
      recargar(tokenInicial);
    } else {
      setCargando(false);
    }
    // Solo se ejecuta al montar el proveedor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email, contrasena) => {
      setError(null);
      const datos = await api.login({ email, contrasena });
      guardarToken(datos.token);
      setUsuario(datos.usuario || null);
      setCargando(false);
      return datos;
    },
    [guardarToken],
  );

  const registrar = useCallback(
    async (datos, tipo = 'maestro') => {
      setError(null);
      const respuesta = tipo === 'alumno' ? await api.registrarAlumno(datos) : await api.registrarMaestro(datos);
      // El alta devuelve sesión (JWT + usuario): entramos sin pasar por el login.
      if (respuesta?.token) {
        guardarToken(respuesta.token);
        setUsuario(respuesta.usuario || null);
        setCargando(false);
      }
      return respuesta;
    },
    [guardarToken],
  );

  const cerrarSesion = useCallback(() => {
    guardarToken(null);
    setUsuario(null);
    setError(null);
    setCargando(false);
  }, [guardarToken]);

  const valor = useMemo(
    () => ({
      token,
      usuario,
      cargando,
      error,
      autenticado: Boolean(token),
      login,
      registrar,
      cerrarSesion,
      recargar,
    }),
    [token, usuario, cargando, error, login, registrar, cerrarSesion, recargar],
  );

  return <AutenticacionContexto.Provider value={valor}>{children}</AutenticacionContexto.Provider>;
}
