import { Router } from 'express';
import { asincrono } from '../utilidades/asincrono.js';
import { validar, validarId } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { exigirRol } from '../middlewares/exigirRol.js';
import {
  accesoSegunRol,
  accesoLeccionSegunRol,
  leccionDelMaestro,
} from '../middlewares/pertenencia.js';
import { subirCsv } from '../middlewares/subidaCsv.js';
import {
  crearLeccionEsquema,
  actualizarLeccionEsquema,
  crearTarjetaEsquema,
} from '../utilidades/esquemas.js';
import { ROLES } from '../utilidades/constantes.js';
import * as controlador from '../controladores/lecciones.controlador.js';

const router = Router();
const soloMaestro = exigirRol(ROLES.MAESTRO);

// Lecciones de un curso: maestro dueño o alumno inscrito.
router.get(
  '/cursos/:cursoId/lecciones',
  verificarToken,
  validarId('cursoId', 'idCurso'),
  asincrono(accesoSegunRol),
  asincrono(controlador.listar),
);
router.post(
  '/cursos/:cursoId/lecciones',
  verificarToken,
  soloMaestro,
  validarId('cursoId', 'idCurso'),
  asincrono(accesoSegunRol),
  validar(crearLeccionEsquema),
  asincrono(controlador.crear),
);

// Una lección y sus tarjetas.
router.get(
  '/lecciones/:id/tarjetas',
  verificarToken,
  validarId('id', 'idLeccion'),
  asincrono(accesoLeccionSegunRol),
  asincrono(controlador.listarTarjetas),
);
router.post(
  '/lecciones/:id/tarjetas',
  verificarToken,
  soloMaestro,
  validarId('id', 'idLeccion'),
  asincrono(leccionDelMaestro),
  validar(crearTarjetaEsquema),
  asincrono(controlador.crearTarjeta),
);

// Importar CSV: antes que otras rutas con :id para evitar ambigüedades.
router.post(
  '/lecciones/:id/importar-csv',
  verificarToken,
  soloMaestro,
  validarId('id', 'idLeccion'),
  asincrono(leccionDelMaestro),
  subirCsv,
  asincrono(controlador.importarCsv),
);

router.put(
  '/lecciones/:id',
  verificarToken,
  soloMaestro,
  validarId('id', 'idLeccion'),
  asincrono(leccionDelMaestro),
  validar(actualizarLeccionEsquema),
  asincrono(controlador.actualizar),
);
router.delete(
  '/lecciones/:id',
  verificarToken,
  soloMaestro,
  validarId('id', 'idLeccion'),
  asincrono(leccionDelMaestro),
  asincrono(controlador.eliminar),
);

export default router;
