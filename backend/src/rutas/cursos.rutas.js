import { Router } from 'express';
import { asincrono } from '../utilidades/asincrono.js';
import { validar, validarId } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { exigirRol } from '../middlewares/exigirRol.js';
import { cursoDelMaestro } from '../middlewares/pertenencia.js';
import { verificarLimite } from '../middlewares/verificarLimite.js';
import { crearCursoEsquema, actualizarCursoEsquema } from '../utilidades/esquemas.js';
import { ROLES } from '../utilidades/constantes.js';
import * as controlador from '../controladores/cursos.controlador.js';

const router = Router();
const soloMaestro = exigirRol(ROLES.MAESTRO);

router.use(verificarToken);

router.post(
  '/',
  soloMaestro,
  validar(crearCursoEsquema),
  verificarLimite('curso'),
  asincrono(controlador.crear),
);
router.get('/', soloMaestro, asincrono(controlador.listar));

router.get(
  '/:id',
  soloMaestro,
  validarId('id', 'idCurso'),
  asincrono(cursoDelMaestro),
  asincrono(controlador.obtener),
);
router.put(
  '/:id',
  soloMaestro,
  validarId('id', 'idCurso'),
  asincrono(cursoDelMaestro),
  validar(actualizarCursoEsquema),
  asincrono(controlador.actualizar),
);
router.delete(
  '/:id',
  soloMaestro,
  validarId('id', 'idCurso'),
  asincrono(cursoDelMaestro),
  asincrono(controlador.eliminar),
);
router.post(
  '/:id/regenerar-codigo',
  soloMaestro,
  validarId('id', 'idCurso'),
  asincrono(cursoDelMaestro),
  asincrono(controlador.regenerarCodigo),
);
router.get(
  '/:id/alumnos',
  soloMaestro,
  validarId('id', 'idCurso'),
  asincrono(cursoDelMaestro),
  asincrono(controlador.listarAlumnos),
);

export default router;
