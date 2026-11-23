import { Resend } from 'resend';
import { entorno } from '../config/entorno.js';

// Proveedor aislado: cambiar Resend por otro solo afecta a este archivo.
const resend = entorno.resendApiKey ? new Resend(entorno.resendApiKey) : null;

export async function enviarCorreo({ para, asunto, texto, html }) {
  // Sin clave (desarrollo): se imprime el enlace en vez de fallar.
  if (!resend) {
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

export function enviarVerificacion(email, token) {
  const url = enlace('/verificar-correo', token);
  return enviarCorreo({
    para: email,
    asunto: 'Confirma tu correo para empezar',
    texto: `Hola:\n\nConfirma tu correo para activar tu cuenta:\n${url}\n\nEl enlace vence en 24 horas.\n`,
    html: `<div style="font-family:Arial,sans-serif"><p>Hola:</p>
      <p>Confirma tu correo para activar tu cuenta.</p>
      <p><a href="${url}" style="background:#2563eb;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px">Confirmar correo</a></p>
      <p>O copia este enlace: ${url}</p><p>El enlace vence en 24 horas.</p></div>`,
  });
}

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
