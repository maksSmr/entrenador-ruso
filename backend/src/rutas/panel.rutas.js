import { Router } from 'express';
import { asincrono } from '../utilidades/asincrono.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { exigirRol } from '../middlewares/exigirRol.js';
import { ROLES } from '../utilidades/constantes.js';
import * as servicio from '../servicios/panel.servicio.js';

const router = Router();

router.get(
  '/panel/alumno',
  verificarToken,
  exigirRol(ROLES.ALUMNO),
  asincrono(async (req, res) => {
    res.json(await servicio.panelAlumno(req.usuario.id));
  }),
);

router.get(
  '/panel/maestro',
  verificarToken,
  exigirRol(ROLES.MAESTRO),
  asincrono(async (req, res) => {
    res.json(await servicio.panelMaestro(req.usuario.id));
  }),
);

router.get(
  '/panel/maestro/reporte',
  verificarToken,
  exigirRol(ROLES.MAESTRO),
  asincrono(async (req, res) => {
    res.json(await servicio.reportePorUnidad(req.usuario.id));
  }),
);

router.get(
  '/panel/maestro/reporte-detallado',
  verificarToken,
  exigirRol(ROLES.MAESTRO),
  asincrono(async (req, res) => {
    res.json(await servicio.reporteDetallado(req.usuario.id));
  }),
);

export default router;
