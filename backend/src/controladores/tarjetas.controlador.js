import * as servicio from '../servicios/tarjetas.servicio.js';

export async function actualizar(req, res) {
  res.json(await servicio.actualizar(req.idTarjeta, req.usuario.id, req.body));
}

export async function eliminar(req, res) {
  await servicio.eliminar(req.idTarjeta, req.usuario.id);
  res.status(204).send();
}
