import { Resend } from 'resend';
import { entorno } from '../config/entorno.js';

// Proveedor aislado: cambiar Resend por otro solo afecta a este archivo.
const resend = entorno.resendApiKey ? new Resend(entorno.resendApiKey) : null;

export async function enviarCorreo({ para, asunto, texto, html }) {
  // Sin clave o fuera de producción: se imprime el enlace y el registro continúa.
  if (!resend || entorno.nodeEnv !== 'production') {
    console.log(`\n--- CORREO SIMULADO para ${para} ---\n${asunto}\n${texto}\n-------------------------------\n`);
    return { simulado: true };
  }

  const { data, error } = await resend.emails.send({
    from: entorno.correoRemitente,
    to: para,
    subject: asunto,
    text: texto,
    html,
  });

  if (error) throw new Error(`No se pudo enviar el correo: ${error.message}`);
  return data;
}

const enlace = (ruta, token) =>
  `${entorno.frontendUrl}${ruta}?token=${encodeURIComponent(token)}`;

// La verificación por correo se eliminó: el alta crea la cuenta verificada.
// No existe enviarVerificacion para que ningún flujo pueda llamarlo por accidente.
export function enviarRestablecimiento(email, token) {
  const url = enlace('/restablecer-contrasena', token);
  return enviarCorreo({
    para: email,
    asunto: 'Restablece tu contraseña',
    texto: `Hola:\n\nRestablece tu contraseña aquí:\n${url}\n\nEl enlace vence en 1 hora. Si no fuiste tú, ignora este correo.\n`,
    html: `<div style="font-family:Arial,sans-serif"><p>Hola:</p>
      <p><a href="${url}" style="background:#2563eb;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px">Restablecer contraseña</a></p>
      <p>O copia este enlace: ${url}</p><p>El enlace vence en 1 hora. Si no fuiste tú, ignora este correo.</p></div>`,
  });
}
