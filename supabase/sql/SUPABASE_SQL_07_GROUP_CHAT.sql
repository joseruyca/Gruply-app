-- GRUPLY · Chat de grupo (Supabase)
-- Ejecuta en Supabase → SQL Editor

-- Tabla
CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_messages_len CHECK (char_length(message) <= 2000)
);

-- Index para listado por grupo
CREATE INDEX IF NOT EXISTS group_messages_group_created_at
  ON public.group_messages (group_id, created_at);

-- RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: solo miembros del grupo
DO $$ BEGIN
  CREATE POLICY group_messages_select_members
  ON public.group_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members gm
      WHERE gm.group_id = group_messages.group_id
        AND gm.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INSERT: solo miembros del grupo, y el user_id debe ser el tuyo
DO $$ BEGIN
  CREATE POLICY group_messages_insert_members
  ON public.group_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.group_members gm
      WHERE gm.group_id = group_messages.group_id
        AND gm.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DELETE: (opcional) solo tu propio mensaje
DO $$ BEGIN
  CREATE POLICY group_messages_delete_own
  ON public.group_messages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fin
