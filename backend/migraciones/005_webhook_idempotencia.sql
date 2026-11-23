-- Prompt 8: evita aplicar dos veces el mismo evento de Stripe.
CREATE TABLE IF NOT EXISTS eventos_stripe (
  id          TEXT PRIMARY KEY,
  tipo        TEXT NOT NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
