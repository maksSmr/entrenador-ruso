-- Reiniciar el repaso no debe volver a dar XP: marcamos esas tarjetas como "sin XP".
-- Idempotente: se puede ejecutar más de una vez en Neon sin perder datos.
ALTER TABLE progreso_tarjetas
  ADD COLUMN IF NOT EXISTS sin_xp BOOLEAN NOT NULL DEFAULT false;
