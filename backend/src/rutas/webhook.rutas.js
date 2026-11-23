import { Router, raw } from 'express';
import { asincrono } from '../utilidades/asincrono.js';
import * as stripe from '../servicios/stripe.servicio.js';

const router = Router();

// El body debe llegar como Buffer: express.json() lo convertiría en objeto.
router.post(
  '/stripe/webhook',
  raw({ type: 'application/json' }),
  asincrono(async (req, res) => {
    const evento = stripe.verificarFirma(
      req.body,
      req.headers['stripe-signature'] ?? '',
    );
    res.json(await stripe.procesarEvento(evento));
  }),
);

export default router;
