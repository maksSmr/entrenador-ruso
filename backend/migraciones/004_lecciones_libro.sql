-- Prompt 12c: lecciones ligadas a las unidades del libro de texto.

ALTER TABLE lecciones
  ADD COLUMN IF NOT EXISTS unidad_libro TEXT,
  ADD COLUMN IF NOT EXISTS fecha_asignada TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_lecciones_asignadas
  ON lecciones (curso_id, fecha_asignada DESC);
