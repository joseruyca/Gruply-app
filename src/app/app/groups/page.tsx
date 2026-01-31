import Link from "next/link";
import { Settings, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listMyGroups } from "@/lib/groups/repo";
import { createInviteAction } from "./actions";
import CreateGroupModal from "./CreateGroupModal";
import InviteModal from "./InviteModal";
import CopyInvite from "./CopyInvite";

function shortId(id: string) {
  return id.length > 10 ? id.slice(0, 8) + " · " : id;
}

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; invite?: string; joined?: string; inviteGroup?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();

  const uid = me.user?.id ?? null;

  // Nombre visible
  let displayName = me.user?.email?.split("@")[0] ?? "Usuario";
  if (uid) {
    const { data: p } = await supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle();
    if (p?.full_name) displayName = String(p.full_name);
  }

  const groups = await listMyGroups();
  const groupsCount = groups.length;

  // Conteos seguros (no rompe si no hay tablas)
  let eventsCount = 0;
  let tournamentsCount = 0;

  try {
    const groupIds = groups.map((g: any) => g.id);
    if (groupIds.length > 0) {
      const ev = await supabase.from("events").select("id", { count: "exact", head: true }).in("group_id", groupIds);
      if (!ev.error) eventsCount = ev.count ?? 0;

      const tt = await supabase.from("tournaments").select("id", { count: "exact", head: true }).in("group_id", groupIds);
      if (!tt.error) tournamentsCount = tt.count ?? 0;
    }
  } catch {}

  const inviteGroupId = sp.inviteGroup ?? null;

  return (
    <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-28 pt-8">
      {(sp.created || sp.invite || sp.joined) && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {sp.created && <div>Grupo creado ??"???</div>}
          {sp.joined && <div>Te has unido ??"???</div>}
          {sp.invite && (
            <div className="mt-2">
              <div className="text-sm font-semibold">Invitación lista</div>
              <div className="mt-1 text-xs text-emerald-700">
                Link: <span className="font-mono">/join/{sp.invite}</span>
              </div>
              <CopyInvite code={sp.invite} />
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-extrabold">GRUPLY</div>
        <Link className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm" href="/app/settings" aria-label="Ajustes">
          <Settings className="h-5 w-5 text-slate-700" />
        </Link>
      </div>

      {/* Welcome */}
      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-slate-500">Bienvenido de nuevo</div>
            <div className="mt-1 text-2xl font-bold">{displayName} 👥</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
            <div className="text-xl font-bold text-emerald-700">{groupsCount}</div>
            <div className="text-xs font-semibold text-emerald-700">Grupos</div>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 text-center">
            <div className="text-xl font-bold text-blue-700">{eventsCount}</div>
            <div className="text-xs font-semibold text-blue-700">Eventos</div>
          </div>
          <div className="rounded-2xl bg-amber-50 p-3 text-center">
            <div className="text-xl font-bold text-amber-700">{tournamentsCount}</div>
            <div className="text-xs font-semibold text-amber-700">Torneos</div>
          </div>
        </div>
      </div>

      {/* Mis grupos */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold tracking-wide text-slate-500">MIS GRUPOS</div>
          <div className="text-xs text-slate-400">{groups.length} grupo{groups.length === 1 ? "" : "s"}</div>
        </div>

        <div className="mt-3 grid gap-3">
          {groups.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Aún no tienes grupos. Crea uno con el botón +.
            </div>
          ) : (
            groups.map((g: any) => (
              <Link
                key={g.id}
                href={`/app/groups/${g.id}`}
                className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-xl">
                    {g.emoji ?? "👥"}
                  </div>
                  <div>
                    <div className="text-base font-semibold">{g.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="capitalize">{g.activity ?? "otro"}</span>
                      <span> · </span>
                      <span>{shortId(g.id)}</span>
                    </div>
                  </div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Floating actions */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
        <InviteModal
          groups={groups.map((g: any) => ({ id: g.id, name: g.name, emoji: g.emoji ?? null, activity: g.activity ?? null }))}
          action={createInviteAction}
          defaultGroupId={inviteGroupId}
          autoOpen={!!inviteGroupId}
        />
        <CreateGroupModal />
      </div>
    </main>
  );
}