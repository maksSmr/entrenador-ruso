import { Router } from 'express';
import { asincrono } from '../utilidades/asincrono.js';
import { validar } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { limiteLogin, limiteReenvio } from '../middlewares/limites.js';
import {
  registroMaestroEsquema,
  registroAlumnoEsquema,
  loginEsquema,
  verificarCorreoEsquema,
  reenviarVerificacionEsquema,
  olvideContrasenaEsquema,
  restablecerContrasenaEsquema,
} from '../utilidades/esquemas.js';
import * as controlador from '../controladores/autenticacion.controlador.js';

const router = Router();

router.post('/registro-maestro', validar(registroMaestroEsquema), asincrono(controlador.registroMaestro));
router.post('/registro-alumno', validar(registroAlumnoEsquema), asincrono(controlador.registroAlumno));
router.post('/login', limiteLogin, validar(loginEsquema), asincrono(controlador.login));

router.post('/verificar-correo', validar(verificarCorreoEsquema), asincrono(controlador.verificarCorreo));
router.post('/reenviar-verificacion', limiteReenvio, validar(reenviarVerificacionEsquema), asincrono(controlador.reenviarVerificacion));
router.post('/olvide-contrasena', validar(olvideContrasenaEsquema), asincrono(controlador.olvideContrasena));
router.post('/restablecer-contrasena', validar(restablecerContrasenaEsquema), asincrono(controlador.restablecerContrasena));

router.get('/yo', verificarToken, asincrono(controlador.yo));

export default router;
