-- GRUPLY · Fix Torneos (compatibilidad de schema)
-- Ejecuta en Supabase → SQL Editor

-- 1) Añade columnas nuevas (si ya existen, no hace nada)
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS allow_draws boolean;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS tiebreak_order text[];

-- 2) Defaults (para nuevos torneos)
ALTER TABLE public.tournaments
  ALTER COLUMN allow_draws SET DEFAULT true;

ALTER TABLE public.tournaments
  ALTER COLUMN tiebreak_order SET DEFAULT ARRAY['points','h2h','diff','for']::text[];

-- 3) Backfill seguro (no sobrescribe si ya tienes valores)
UPDATE public.tournaments
SET
  allow_draws = COALESCE(allow_draws, true),
  tiebreak_order = COALESCE(tiebreak_order, ARRAY['points','h2h','diff','for']::text[]);

-- Fin
