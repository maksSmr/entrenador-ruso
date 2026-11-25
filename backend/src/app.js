import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { entorno } from './config/entorno.js';
import rutasAutenticacion from './rutas/autenticacion.rutas.js';
import rutasCursos from './rutas/cursos.rutas.js';
import rutasInscripciones from './rutas/inscripciones.rutas.js';
import rutasLecciones from './rutas/lecciones.rutas.js';
import rutasTarjetas from './rutas/tarjetas.rutas.js';
import rutasSuscripcion from './rutas/suscripcion.rutas.js';
import rutasRepaso from './rutas/repaso.rutas.js';
import rutasQuiz from './rutas/quiz.rutas.js';
import rutasPanel from './rutas/panel.rutas.js';
import rutasWebhook from './rutas/webhook.rutas.js';
import { noEncontrado, manejarErrores } from './middlewares/manejarErrores.js';

// app.js NO escucha: así Jest puede importarla con supertest.
const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: entorno.origenesPermitidos, credentials: true }));

// Webhook primero: Stripe firma el body crudo, no el JSON ya parseado.
app.use(rutasWebhook);
app.use(express.json({ limit: '1mb' }));

app.get('/salud', (_req, res) => res.json({ estado: 'ok' }));

app.use('/auth', rutasAutenticacion);
app.use('/cursos', rutasCursos);
app.use('/tarjetas', rutasTarjetas);
app.use('/', rutasSuscripcion);
app.use('/', rutasRepaso);
app.use('/', rutasQuiz);
app.use('/', rutasPanel);
app.use('/', rutasLecciones);
app.use('/', rutasInscripciones);

app.use(noEncontrado);
app.use(manejarErrores);

export default app;
