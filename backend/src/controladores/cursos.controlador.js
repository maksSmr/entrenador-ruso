import * as servicio from '../servicios/cursos.servicio.js';

export async function listar(req, res) {
  res.json(await servicio.listarPorMaestro(req.usuario.id));
}

export async function obtener(req, res) {
  res.json(await servicio.obtenerPorId(req.idCurso, req.usuario.id));
}

export async function crear(req, res) {
  res.status(201).json(await servicio.crear(req.usuario.id, req.body));
}

export async function actualizar(req, res) {
  res.json(await servicio.actualizar(req.idCurso, req.usuario.id, req.body));
}

export async function eliminar(req, res) {
  await servicio.eliminar(req.idCurso, req.usuario.id);
  res.status(204).send();
}

export async function regenerarCodigo(req, res) {
  res.json(await servicio.regenerarCodigo(req.idCurso, req.usuario.id));
}

export async function listarAlumnos(req, res) {
  res.json(await servicio.listarAlumnos(req.idCurso, req.usuario.id));
}

export async function inscribirse(req, res) {
  res.status(201).json(await servicio.inscribirConCodigo(req.usuario.id, req.body.codigo_invitacion));
}

export async function misCursos(req, res) {
  res.json(await servicio.listarMisCursos(req.usuario.id));
}
