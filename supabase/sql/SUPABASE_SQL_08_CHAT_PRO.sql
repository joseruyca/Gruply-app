-- GRUPLY · Chat PRO (WhatsApp-like)
-- Ejecuta en Supabase → SQL Editor
-- Recomendación: ejecútalo DESPUÉS de SUPABASE_SQL_07_GROUP_CHAT.sql

-- 0) Bucket de adjuntos (Storage)
-- Nota: si ya existe, no pasa nada.
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-chat', 'group-chat', false)
ON CONFLICT (id) DO NOTHING;

-- 1) Añadir columnas PRO a group_messages
ALTER TABLE public.group_messages
  ADD COLUMN IF NOT EXISTS reply_to uuid NULL,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS attachment_path text NULL,
  ADD COLUMN IF NOT EXISTS attachment_mime text NULL,
  ADD COLUMN IF NOT EXISTS attachment_name text NULL,
  ADD COLUMN IF NOT EXISTS attachment_size bigint NULL;

DO $$ BEGIN
  ALTER TABLE public.group_messages
    ADD CONSTRAINT group_messages_reply_to_fkey
    FOREIGN KEY (reply_to) REFERENCES public.group_messages(id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS group_messages_group_id_created_at_desc_idx
  ON public.group_messages (group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS group_messages_reply_to_idx
  ON public.group_messages (reply_to);

-- 2) Tabla de mensajes fijados (pins)
CREATE TABLE IF NOT EXISTS public.group_message_pins (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, message_id)
);

CREATE INDEX IF NOT EXISTS group_message_pins_group_id_created_at_idx
  ON public.group_message_pins (group_id, created_at DESC);

-- 3) Estado de lectura (read receipts)
CREATE TABLE IF NOT EXISTS public.group_chat_state (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_chat_state_group_id_idx
  ON public.group_chat_state (group_id);

-- 4) Helper: es miembro / admin del grupo
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = auth.uid()
      AND COALESCE(gm.role,'member') IN ('admin','owner')
  );
$$;

-- 5) RLS: group_messages (añadimos UPDATE, mantenemos SELECT/INSERT de SQL_07)
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY group_messages_update_own
  ON public.group_messages
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY group_messages_update_admin
  ON public.group_messages
  FOR UPDATE
  TO authenticated
  USING (public.is_group_admin(group_messages.group_id))
  WITH CHECK (public.is_group_admin(group_messages.group_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6) RLS: pins
ALTER TABLE public.group_message_pins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY group_message_pins_select_members
  ON public.group_message_pins
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_message_pins.group_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY group_message_pins_insert_admin
  ON public.group_message_pins
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_group_admin(group_message_pins.group_id) AND pinned_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY group_message_pins_delete_admin
  ON public.group_message_pins
  FOR DELETE
  TO authenticated
  USING (public.is_group_admin(group_message_pins.group_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7) RLS: chat_state
ALTER TABLE public.group_chat_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY group_chat_state_select_members
  ON public.group_chat_state
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_chat_state.group_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY group_chat_state_upsert_self
  ON public.group_chat_state
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_group_member(group_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY group_chat_state_update_self
  ON public.group_chat_state
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8) Storage RLS (adjuntos)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Lee adjuntos solo si eres miembro del grupo cuyo uuid es el primer segmento de la ruta (groupId/archivo)
DO $$ BEGIN
  CREATE POLICY group_chat_storage_read
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'group-chat'
    AND public.is_group_member( (split_part(name,'/',1))::uuid )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sube adjuntos solo si eres miembro; la ruta debe empezar por tu groupId
DO $$ BEGIN
  CREATE POLICY group_chat_storage_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'group-chat'
    AND owner = auth.uid()
    AND public.is_group_member( (split_part(name,'/',1))::uuid )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY group_chat_storage_delete_own
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'group-chat' AND owner = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9) Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_message_pins;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_state;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fin
