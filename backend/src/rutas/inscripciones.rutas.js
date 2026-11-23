import { Router } from 'express';
import { asincrono } from '../utilidades/asincrono.js';
import { validar } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { exigirRol } from '../middlewares/exigirRol.js';
import { verificarLimite } from '../middlewares/verificarLimite.js';
import { inscribirseEsquema } from '../utilidades/esquemas.js';
import { ROLES } from '../utilidades/constantes.js';
import * as controlador from '../controladores/cursos.controlador.js';

const router = Router();

router.post(
  '/inscripciones',
  verificarToken,
  exigirRol(ROLES.ALUMNO),
  validar(inscribirseEsquema),
  verificarLimite('alumno'),
  asincrono(controlador.inscribirse),
);

router.get(
  '/mis-cursos',
  verificarToken,
  exigirRol(ROLES.ALUMNO),
  asincrono(controlador.misCursos),
);

export default router;
