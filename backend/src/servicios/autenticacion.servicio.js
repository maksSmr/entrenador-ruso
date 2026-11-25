import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/baseDatos.js';
import { entorno } from '../config/entorno.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import {
  ROLES,
  HORAS_RESTABLECIMIENTO,
} from '../utilidades/constantes.js';
import * as tokens from './tokens.servicio.js';
import * as correo from './correo.js';
import { obtenerPlan } from '../config/planes.js';
import { contarRecurso, leerPlan } from './planes.servicio.js';

const RONDAS_HASH = 10;
const MENSAJE_GENERICO = 'Si el correo existe, te enviamos un enlace';

// Solo se usa en recuperación de contraseña: si Resend falla, la petición continúa.
async function enviarSinRomper(envio) {
  try {
    await envio();
  } catch (error) {
    console.error('No se pudo enviar el correo:', error.message);
  }
}

function sesionPara(usuario) {
  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol, email_verificado: true },
    entorno.jwtSecret,
    { expiresIn: entorno.jwtExpira },
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      email_verificado: true,
    },
  };
}

async function crearUsuario(cliente, { nombre, email, contrasena, rol }) {
  const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_HASH);
  // Alta directa: la cuenta nace verificada, sin depender de Resend ni de Gmail.
  const { rows } = await cliente.query(
    `INSERT INTO usuarios (nombre, email, contrasena_hash, rol, email_verificado, verificado_en)
     VALUES ($1, $2, $3, $4, true, NOW())
     RETURNING id, nombre, email, rol, email_verificado`,
    [nombre, email, contrasenaHash, rol],
  );
  return rows[0];
}

export async function registrarMaestro(datos) {
  const cliente = await pool.connect();
  let usuario;

  try {
    await cliente.query('BEGIN');
    usuario = await crearUsuario(cliente, { ...datos, rol: ROLES.MAESTRO });
    await cliente.query(
      "INSERT INTO suscripciones (maestro_id, plan, estado) VALUES ($1, 'gratis', 'activa')",
      [usuario.id],
    );
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  // Devolvemos sesión lista para usar. El correo de bienvenida es opcional.
  return sesionPara(usuario);
}

export async function registrarAlumno({ codigo_invitacion, ...datos }) {
  const { rows: cursos } = await pool.query(
    'SELECT id, maestro_id FROM cursos WHERE codigo_invitacion = $1',
    [codigo_invitacion],
  );
  if (!cursos.length) {
    throw new ErrorApi(400, 'Código de invitación no válido', 'codigo_invalido');
  }

  // El registro por invitación también respeta el límite del maestro.
  const curso = cursos[0];
  const nombrePlan = await leerPlan(curso.maestro_id);
  const limite = obtenerPlan(nombrePlan).alumnos;
  if (limite !== null) {
    const usados = await contarRecurso('alumno', curso.maestro_id);
    if (usados >= limite) {
      throw new ErrorApi(409, 'El maestro ha llegado al límite de alumnos de su plan', 'limite_plan', {
        limite, usados, plan: nombrePlan,
      });
    }
  }

  const cliente = await pool.connect();
  let usuario;

  try {
    await cliente.query('BEGIN');

    const existe = await cliente.query(
      'SELECT 1 FROM usuarios WHERE email = $1',
      [datos.email],
    );
    if (existe.rowCount) {
      throw new ErrorApi(409, 'Ya existe una cuenta con ese correo', 'email_duplicado');
    }

    // Inscripción inmediata y cuenta verificada: entra sin esperar correos.
    usuario = await crearUsuario(cliente, { ...datos, rol: ROLES.ALUMNO });
    await cliente.query(
      'INSERT INTO inscripciones (usuario_id, curso_id) VALUES ($1, $2)',
      [usuario.id, cursos[0].id],
    );
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  return sesionPara(usuario);
}

export async function iniciarSesion(email, contrasena) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, rol, contrasena_hash
       FROM usuarios WHERE email = $1`,
    [email],
  );
  const usuario = rows[0];

  if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena_hash))) {
    // Mismo mensaje para ambos casos: no revelamos si el correo está registrado.
    throw new ErrorApi(401, 'Credenciales inválidas', 'credenciales_invalidas');
  }

  // No hay bloqueo por verificación: cualquier cuenta con contraseña válida entra.
  return sesionPara(usuario);
}

export async function obtenerYo(usuarioId) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, rol, xp, racha, email_verificado, ultima_actividad
       FROM usuarios WHERE id = $1`,
    [usuarioId],
  );
  if (!rows.length) throw new ErrorApi(404, 'Usuario no encontrado', 'no_encontrado');
  return rows[0];
}

export async function verificarCorreo(token) {
  const usuarioId = await tokens.consumirToken(token, 'verificar_email');
  await pool.query(
    'UPDATE usuarios SET email_verificado = true, verificado_en = NOW() WHERE id = $1',
    [usuarioId],
  );
  return { mensaje: 'Correo verificado. Ya puedes iniciar sesión.' };
}

export async function reenviarVerificacion() {
  // Se mantiene por compatibilidad de API, pero ya no crea tokens ni envía correos.
  return { mensaje: MENSAJE_GENERICO };
}

export async function olvideContrasena(email) {
  const { rows } = await pool.query(
    'SELECT id, email FROM usuarios WHERE email = $1',
    [email],
  );
  const usuario = rows[0];

  if (usuario) {
    await tokens.invalidarTokens(usuario.id, 'restablecer_contrasena');
    const token = await tokens.crearToken(
      usuario.id, 'restablecer_contrasena', HORAS_RESTABLECIMIENTO,
    );
    await enviarSinRomper(() => correo.enviarRestablecimiento(usuario.email, token));
  }

  return { mensaje: MENSAJE_GENERICO };
}

export async function restablecerContrasena(token, contrasenaNueva) {
  const usuarioId = await tokens.consumirToken(token, 'restablecer_contrasena');
  const contrasenaHash = await bcrypt.hash(contrasenaNueva, RONDAS_HASH);

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('UPDATE usuarios SET contrasena_hash = $1 WHERE id = $2', [contrasenaHash, usuarioId]);
    await cliente.query(
      'UPDATE tokens_verificacion SET usado_en = NOW() WHERE usuario_id = $1 AND usado_en IS NULL',
      [usuarioId],
    );
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  return { mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}
