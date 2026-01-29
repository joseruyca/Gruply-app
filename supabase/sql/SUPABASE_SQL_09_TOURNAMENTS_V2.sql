-- GRUPLY · Torneos v2 (fix scoring_mode constraint + schedule_mode)
-- Ejecuta en Supabase → SQL Editor

-- 1) Columnas nuevas (compatibles)
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS schedule_mode text NULL,
  ADD COLUMN IF NOT EXISTS allow_draws boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tiebreak_order text[] NULL;

-- Si en tu base habías guardado rr1/rr2/manual en scoring_mode, lo copiamos a schedule_mode
UPDATE public.tournaments
SET schedule_mode = scoring_mode
WHERE schedule_mode IS NULL AND scoring_mode IN ('rr1','rr2','manual');

-- 2) Asegurar que el check constraint no rompa creaciones
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tournaments_scoring_mode_check'
      AND conrelid = 'public.tournaments'::regclass
  ) THEN
    ALTER TABLE public.tournaments DROP CONSTRAINT tournaments_scoring_mode_check;
  END IF;
END $$;

-- Permitimos un superset de valores para no romper datos existentes
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_scoring_mode_check
  CHECK (
    scoring_mode IS NULL OR scoring_mode IN (
      'wdl','wld','points','win_draw_loss','win_loss_draw','wl','win_only','sets',
      'rr1','rr2','manual'
    )
  );

-- Fin
