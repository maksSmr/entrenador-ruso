import { Router } from 'express';
import { asincrono } from '../utilidades/asincrono.js';
import { validar, validarId } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { exigirRol } from '../middlewares/exigirRol.js';
import { accesoCurso } from '../middlewares/pertenencia.js';
import { respuestaRepasoEsquema } from '../utilidades/esquemas.js';
import { ROLES } from '../utilidades/constantes.js';
import * as servicio from '../servicios/repaso.servicio.js';

const router = Router();
const soloAlumno = exigirRol(ROLES.ALUMNO);

router.get(
  '/cursos/:cursoId/repaso/hoy',
  verificarToken,
  soloAlumno,
  validarId('cursoId', 'idCurso'),
  asincrono(accesoCurso),
  asincrono(async (req, res) => {
    res.json(await servicio.repasoDeHoy(req.idCurso, req.usuario.id));
  }),
);

router.post(
  '/cursos/:cursoId/repaso/reiniciar',
  verificarToken,
  soloAlumno,
  validarId('cursoId', 'idCurso'),
  asincrono(accesoCurso),
  asincrono(async (req, res) => {
    res.json(await servicio.reiniciar(req.idCurso, req.usuario.id));
  }),
);

router.post(
  '/repaso/respuesta',
  verificarToken,
  soloAlumno,
  validar(respuestaRepasoEsquema),
  asincrono(async (req, res) => {
    const { tarjeta_id, acerto } = req.body;
    res.json(await servicio.responder(tarjeta_id, acerto, req.usuario.id));
  }),
);

export default router;
