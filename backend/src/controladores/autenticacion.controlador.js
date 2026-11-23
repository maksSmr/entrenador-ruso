import * as servicio from '../servicios/autenticacion.servicio.js';

export async function registroMaestro(req, res) {
  res.status(201).json(await servicio.registrarMaestro(req.body));
}

export async function registroAlumno(req, res) {
  res.status(201).json(await servicio.registrarAlumno(req.body));
}

export async function login(req, res) {
  res.json(await servicio.iniciarSesion(req.body.email, req.body.contrasena));
}

export async function yo(req, res) {
  res.json(await servicio.obtenerYo(req.usuario.id));
}

export async function verificarCorreo(req, res) {
  res.json(await servicio.verificarCorreo(req.body.token));
}

export async function reenviarVerificacion(req, res) {
  res.json(await servicio.reenviarVerificacion(req.body.email));
}

export async function olvideContrasena(req, res) {
  res.json(await servicio.olvideContrasena(req.body.email));
}

export async function restablecerContrasena(req, res) {
  res.json(await servicio.restablecerContrasena(req.body.token, req.body.contrasena));
}
