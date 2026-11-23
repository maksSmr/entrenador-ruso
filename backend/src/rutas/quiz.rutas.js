import { Router } from 'express';
import { asincrono } from '../utilidades/asincrono.js';
import { validar, validarId } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { exigirRol } from '../middlewares/exigirRol.js';
import { accesoLeccionSegunRol } from '../middlewares/pertenencia.js';
import { resultadoQuizEsquema } from '../utilidades/esquemas.js';
import { ROLES } from '../utilidades/constantes.js';
import * as servicio from '../servicios/quiz.servicio.js';

const router = Router();
const soloAlumno = exigirRol(ROLES.ALUMNO);

router.get(
  '/lecciones/:id/quiz',
  verificarToken,
  validarId('id', 'idLeccion'),
  asincrono(accesoLeccionSegunRol),
  asincrono(async (req, res) => {
    const cantidad = Number(req.query.cantidad ?? 4);
    res.json(await servicio.generarQuiz(
      req.idLeccion,
      Number.isInteger(cantidad) && cantidad > 0 ? Math.min(cantidad, 10) : 4,
      req.usuario,
    ));
  }),
);

router.post(
  '/quiz/resultado',
  verificarToken,
  soloAlumno,
  validar(resultadoQuizEsquema),
  asincrono(async (req, res) => {
    res.status(201).json(await servicio.guardarResultado(req.body, req.usuario.id));
  }),
);

export default router;
