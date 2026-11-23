import { useEffect, useRef, useState } from 'react';
import Boton from '../atomos/Boton';
import { reenviarVerificacion } from '../servicios/api';

/** Botón de reenvío con cuenta regresiva de 60 s y mensaje accesible. */
export default function ReenvioVerificacion({ email, compacto = false, etiqueta = 'Reenviar correo' }) {
  const [segundos, setSegundos] = useState(60);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const referenciaMensaje = useRef(null);

  useEffect(() => {
    if (segundos <= 0) return undefined;
    const temporizador = setInterval(() => setSegundos((valor) => Math.max(0, valor - 1)), 1000);
    return () => clearInterval(temporizador);
  }, [segundos > 0]);

  useEffect(() => {
    if (mensaje && referenciaMensaje.current) {
      referenciaMensaje.current.focus();
    }
  }, [mensaje]);

  const reenviar = async () => {
    if (!email || cargando || segundos > 0) return;
    setCargando(true);
    try {
      await reenviarVerificacion(email);
      setMensaje('Si el correo existe, te hemos enviado un enlace nuevo. Revisa tu bandeja de entrada.');
      setSegundos(60);
    } catch (errorApi) {
      setMensaje(errorApi.message || 'No se pudo reenviar el correo. Inténtalo más tarde.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={compacto ? 'reenvio reenvio--compacto' : 'reenvio'}>
      <Boton
        variante={compacto ? 'secundario' : 'primario'}
        tamano={compacto ? 'pequeno' : 'normal'}
        onClick={reenviar}
        disabled={segundos > 0 || !email}
        cargando={cargando}
      >
        {etiqueta}
        {segundos > 0 ? ` (${segundos} s)` : ''}
      </Boton>
      <p
        ref={referenciaMensaje}
        className="texto-suave"
        role="status"
        aria-live="polite"
        tabIndex={-1}
      >
        {mensaje}
      </p>
    </div>
  );
}
