import Stripe from 'stripe';
import { pool } from '../config/baseDatos.js';
import { entorno } from '../config/entorno.js';
import { ErrorApi } from '../utilidades/errorApi.js';

const stripe = entorno.stripeSecretKey ? new Stripe(entorno.stripeSecretKey) : null;

function exigirStripe() {
  if (!stripe) {
    throw new ErrorApi(503, 'Stripe no está configurado en este entorno', 'stripe_no_configurado');
  }
  return stripe;
}

export async function crearCheckout(maestroId) {
  const proveedor = exigirStripe();
  if (!entorno.stripePrecioPro) {
    throw new ErrorApi(503, 'Falta STRIPE_PRECIO_PRO', 'stripe_no_configurado');
  }
  const { rows } = await pool.query('SELECT email FROM usuarios WHERE id = $1', [maestroId]);
  const email = rows[0]?.email;
  const sesion = await proveedor.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: entorno.stripePrecioPro, quantity: 1 }],
    success_url: `${entorno.frontendUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${entorno.frontendUrl}/planes`,
    metadata: { maestro_id: String(maestroId) },
    subscription_data: { metadata: { maestro_id: String(maestroId) } },
  });
  return { url: sesion.url, id: sesion.id };
}

export async function crearPortal(maestroId) {
  const proveedor = exigirStripe();
  const { rows } = await pool.query(
    'SELECT proveedor_id FROM suscripciones WHERE maestro_id = $1',
    [maestroId],
  );
  const clienteId = rows[0]?.proveedor_id;
  if (!clienteId || !clienteId.startsWith('cus_')) {
    throw new ErrorApi(400, 'Aún no tienes una suscripción de Stripe', 'sin_cliente_stripe');
  }

  const sesion = await proveedor.billingPortal.sessions.create({
    customer: clienteId,
    return_url: `${entorno.frontendUrl}/planes`,
  });
  return { url: sesion.url };
}

export function verificarFirma(cuerpo, firma) {
  const proveedor = exigirStripe();
  if (!entorno.stripeWebhookSecret) {
    throw new ErrorApi(503, 'Falta STRIPE_WEBHOOK_SECRET', 'webhook_no_configurado');
  }
  try {
    return proveedor.webhooks.constructEvent(
      cuerpo, firma, entorno.stripeWebhookSecret,
    );
  } catch {
    throw new ErrorApi(400, 'Firma de webhook inválida', 'firma_invalida');
  }
}

// Procesa el evento ya verificado. La tabla eventos_stripe da idempotencia.
export async function procesarEvento(evento) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const nuevo = await cliente.query(
      'INSERT INTO eventos_stripe (id, tipo) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [evento.id, evento.type],
    );
    if (!nuevo.rowCount) {
      await cliente.query('COMMIT');
      return { procesado: false, motivo: 'duplicado' };
    }

    const objeto = evento.data?.object ?? {};

    if (evento.type === 'checkout.session.completed') {
      const maestroId = Number(objeto.metadata?.maestro_id);
      if (maestroId) {
        await cliente.query(
          `UPDATE suscripciones
              SET plan = 'pro', estado = 'activa', proveedor_id = $2
            WHERE maestro_id = $1`,
          [maestroId, objeto.customer ?? null],
        );
      }
    }

    if (evento.type === 'customer.subscription.deleted') {
      await cliente.query(
        `UPDATE suscripciones SET plan = 'gratis', estado = 'cancelada'
          WHERE proveedor_id = $1`,
        [objeto.customer],
      );
    }

    await cliente.query('COMMIT');
    return { procesado: true };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
