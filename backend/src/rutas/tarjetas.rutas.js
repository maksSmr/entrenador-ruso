import { Router } from 'express';
import { asincrono } from '../utilidades/asincrono.js';
import { validar, validarId } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { exigirRol } from '../middlewares/exigirRol.js';
import { tarjetaDelMaestro } from '../middlewares/pertenencia.js';
import { actualizarTarjetaEsquema } from '../utilidades/esquemas.js';
import { ROLES } from '../utilidades/constantes.js';
import * as controlador from '../controladores/tarjetas.controlador.js';

const router = Router();
const soloMaestro = exigirRol(ROLES.MAESTRO);

router.put(
  '/:id',
  verificarToken,
  soloMaestro,
  validarId('id', 'idTarjeta'),
  asincrono(tarjetaDelMaestro),
  validar(actualizarTarjetaEsquema),
  asincrono(controlador.actualizar),
);
router.delete(
  '/:id',
  verificarToken,
  soloMaestro,
  validarId('id', 'idTarjeta'),
  asincrono(tarjetaDelMaestro),
  asincrono(controlador.eliminar),
);

export default router;
