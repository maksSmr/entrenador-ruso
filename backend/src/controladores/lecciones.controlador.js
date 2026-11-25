import * as servicio from '../servicios/lecciones.servicio.js';
import * as tarjetas from '../servicios/tarjetas.servicio.js';
import * as importador from '../servicios/importar.servicio.js';
import * as gemini from '../servicios/gemini.servicio.js';
import { extraerTexto } from '../utilidades/documentos.js';
import { ErrorApi } from '../utilidades/errorApi.js';

export async function listar(req, res) {
  res.json(await servicio.listarPorCurso(req.idCurso, req.usuario));
}

export async function crear(req, res) {
  res.status(201).json(await servicio.crear(req.idCurso, req.usuario.id, req.body));
}

export async function actualizar(req, res) {
  res.json(await servicio.actualizar(req.idLeccion, req.usuario.id, req.body));
}

export async function eliminar(req, res) {
  await servicio.eliminar(req.idLeccion, req.usuario.id);
  res.status(204).send();
}

export async function listarTarjetas(req, res) {
  res.json(await tarjetas.listarPorLeccion(req.idLeccion, req.usuario));
}

export async function crearTarjeta(req, res) {
  res.status(201).json(await tarjetas.crear(req.idLeccion, req.usuario.id, req.body));
}

export async function importarCsv(req, res) {
  if (!req.file) throw new ErrorApi(400, 'Falta el archivo en el campo "archivo"', 'archivo_faltante');
  const contenido = req.file.buffer.toString('utf8');
  res.status(201).json(await importador.importarCsv(req.idLeccion, contenido, req.usuario.id));
}

/** Sugiere tarjetas con Gemini; NO guarda nada: el maestro las revisa antes de crearlas. */
export async function generarTarjetas(req, res) {
  if (!req.file) throw new ErrorApi(400, 'Falta el archivo en el campo "archivo"', 'archivo_faltante');
  const texto = await extraerTexto(req.file);
  if (texto.length < 20) {
    throw new ErrorApi(400, 'El documento no contiene texto suficiente para generar tarjetas', 'documento_vacio');
  }
  const sugerencias = await gemini.generarSugerencias(texto);
  res.json({ sugerencias, caracteres_procesados: texto.length });
}
