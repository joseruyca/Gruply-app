-- SUPABASE_SQL_10_TOURNAMENT_PERMS.sql
-- Permisos de torneos: admin + miembro con permiso explícito.
--
-- Ejecuta este SQL DESPUÉS de:
--  - SUPABASE_SQL_08_CHAT_PRO.sql (helpers is_group_member/is_group_admin)
--  - SUPABASE_SQL_09_TOURNAMENTS_V2.sql (scoring/checks de torneos)

-- 1) Nueva columna en group_members
alter table if exists public.group_members
  add column if not exists can_manage_tournaments boolean not null default false;

-- 2) Helper: ¿soy manager de torneos del grupo?
create or replace function public.is_tournament_manager(p_group_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
      and (gm.role = 'admin' or gm.can_manage_tournaments = true)
  );
$$;

-- 3) Helpers por torneo
create or replace function public.tournament_group_id(p_tournament_id uuid)
returns uuid
language sql
stable
as $$
  select t.group_id
  from public.tournaments t
  where t.id = p_tournament_id
$$;

create or replace function public.is_tournament_manager_for_tournament(p_tournament_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_tournament_manager(public.tournament_group_id(p_tournament_id));
$$;

create or replace function public.is_group_member_for_tournament(p_tournament_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_group_member(public.tournament_group_id(p_tournament_id));
$$;

-- 4) group_members: permitir UPDATE a admins (para asignar permisos)
alter table if exists public.group_members enable row level security;

do $$
begin
  create policy group_members_update_admin on public.group_members
    for update to authenticated
    using (public.is_group_admin(group_id))
    with check (public.is_group_admin(group_id));
exception when duplicate_object then null;
end $$;

-- 5) torneos: managers pueden crear/editar/borrar; miembros pueden leer
alter table if exists public.tournaments enable row level security;

do $$
begin
  create policy tournaments_select_members on public.tournaments
    for select to authenticated
    using (public.is_group_member(group_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournaments_insert_managers on public.tournaments
    for insert to authenticated
    with check (public.is_tournament_manager(group_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournaments_update_managers on public.tournaments
    for update to authenticated
    using (public.is_tournament_manager(group_id))
    with check (public.is_tournament_manager(group_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournaments_delete_managers on public.tournaments
    for delete to authenticated
    using (public.is_tournament_manager(group_id));
exception when duplicate_object then null;
end $$;

-- 6) matches: managers pueden gestionar; miembros pueden leer
alter table if exists public.tournament_matches enable row level security;

do $$
begin
  create policy tournament_matches_select_members on public.tournament_matches
    for select to authenticated
    using (public.is_group_member_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournament_matches_insert_managers on public.tournament_matches
    for insert to authenticated
    with check (public.is_tournament_manager_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournament_matches_update_managers on public.tournament_matches
    for update to authenticated
    using (public.is_tournament_manager_for_tournament(tournament_id))
    with check (public.is_tournament_manager_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournament_matches_delete_managers on public.tournament_matches
    for delete to authenticated
    using (public.is_tournament_manager_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;

-- 7) matchdays: managers pueden cerrar/abrir; miembros pueden leer
alter table if exists public.tournament_matchdays enable row level security;

do $$
begin
  create policy tournament_matchdays_select_members on public.tournament_matchdays
    for select to authenticated
    using (public.is_group_member_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournament_matchdays_insert_managers on public.tournament_matchdays
    for insert to authenticated
    with check (public.is_tournament_manager_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournament_matchdays_update_managers on public.tournament_matchdays
    for update to authenticated
    using (public.is_tournament_manager_for_tournament(tournament_id))
    with check (public.is_tournament_manager_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournament_matchdays_delete_managers on public.tournament_matchdays
    for delete to authenticated
    using (public.is_tournament_manager_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;

-- 8) participantes: miembros pueden apuntarse/salirse y leer
alter table if exists public.tournament_participants enable row level security;

do $$
begin
  create policy tournament_participants_select_members on public.tournament_participants
    for select to authenticated
    using (public.is_group_member_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournament_participants_insert_members on public.tournament_participants
    for insert to authenticated
    with check (public.is_group_member_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy tournament_participants_delete_members on public.tournament_participants
    for delete to authenticated
    using (public.is_group_member_for_tournament(tournament_id));
exception when duplicate_object then null;
end $$;
