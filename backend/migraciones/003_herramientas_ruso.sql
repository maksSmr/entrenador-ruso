-- Prompt 12b: campos específicos del cirílico en las tarjetas. Tabla sin datos added.

ALTER TABLE tarjetas
  ADD COLUMN IF NOT EXISTS acento_posicion INTEGER,
  ADD COLUMN IF NOT EXISTS ejemplo_ruso TEXT,
  ADD COLUMN IF NOT EXISTS ejemplo_traduccion TEXT,
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- La posición del acento debe caer dentro de la palabra (0 = primera letra).
ALTER TABLE tarjetas
  DROP CONSTRAINT IF EXISTS tarjetas_acento_posicion_check;

ALTER TABLE tarjetas
  ADD CONSTRAINT tarjetas_acento_posicion_check
  CHECK (acento_posicion IS NULL OR acento_posicion >= 0);
