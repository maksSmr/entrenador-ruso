import { Router } from 'express';
import { asincrono } from '../utilidades/asincrono.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { exigirRol } from '../middlewares/exigirRol.js';
import { ROLES } from '../utilidades/constantes.js';
import { miPlan } from '../servicios/planes.servicio.js';
import * as stripe from '../servicios/stripe.servicio.js';

const router = Router();
const soloMaestro = exigirRol(ROLES.MAESTRO);

router.get('/mi-plan', verificarToken, asincrono(async (req, res) => {
  res.json(await miPlan(req.usuario));
}));

router.post(
  '/suscripcion/checkout',
  verificarToken,
  soloMaestro,
  asincrono(async (req, res) => {
    res.json(await stripe.crearCheckout(req.usuario.id));
  }),
);

router.post(
  '/suscripcion/portal',
  verificarToken,
  soloMaestro,
  asincrono(async (req, res) => {
    res.json(await stripe.crearPortal(req.usuario.id));
  }),
);

export default router;
