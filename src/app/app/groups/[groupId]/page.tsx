import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupOrNull } from "@/lib/group/detail";
import { ArrowLeft, Settings, UserPlus, Sparkles, CalendarDays } from "lucide-react";
import { getMyRsvpsForEvents } from "@/lib/events/repo";
import { groupEventRsvpAction } from "./actions";

function statCard(title: string, value: number, hint: string, style: "green" | "blue" | "amber") {
  const map = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  } as const;

  return (
    <div className={`rounded-3xl p-4 ${map[style]}`}>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="mt-1 text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs opacity-80">{hint}</div>
    </div>
  );
}
function fmtWhen(iso: string) {
  try {
    const d = new Date(iso);
    const day = d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });
    const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return `${day} · ${time}`;
  } catch {
    return "";
  }
}

export default async function GroupHomePage({ params, searchParams }: { params: Promise<{ groupId: string }>; searchParams: Promise<{ saved?: string; joined?: string }> }) {
  const { groupId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const group = await getGroupOrNull(groupId);
  if (!group) {
    return (
      <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-24 pt-8">
        <Link className="text-sm font-semibold text-emerald-600 underline" href="/app/groups">
          {"\u2190"} Volver
        </Link>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Grupo no encontrado.
        </div>
      </main>
    );
  }

  const membersQ = await supabase.from("group_members").select("*", { count: "exact", head: true }).eq("group_id", groupId);
  const membersCount = membersQ.error ? 0 : membersQ.count ?? 0;

  const tournamentsQ = await supabase.from("tournaments").select("id", { count: "exact", head: true }).eq("group_id", groupId);
  const tournamentsCount = tournamentsQ.error ? 0 : tournamentsQ.count ?? 0;

  // --- Métricas (ligeras, sin traer grandes datasets) ---
  const now = new Date();
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const prev7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let upcomingCount = 0;
  try {
    const ev = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .gte("starts_at", now.toISOString())
      .lt("starts_at", next7.toISOString());
    if (!ev.error) upcomingCount = ev.count ?? 0;
  } catch {}

  // --- Próximos eventos (lista + RSVP en esta pantalla) ---
  let upcomingEvents: Array<{ id: string; title: string; starts_at: string; place: string | null }> = [];
  let rsvps: Record<string, "yes" | "maybe" | "no"> = {};
  try {
    const ev2 = await supabase
      .from("events")
      .select("id,title,starts_at,place,status")
      .eq("group_id", groupId)
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(5);

    if (!ev2.error) {
      upcomingEvents = (ev2.data ?? [])
        .filter((x: any) => x.status === "published")
        .map((x: any) => ({
          id: String(x.id),
          title: x.title ?? "",
          starts_at: x.starts_at,
          place: x.place ?? null,
        }));

      const ids2 = upcomingEvents.map((e) => e.id);
      if (ids2.length) rsvps = await getMyRsvpsForEvents(ids2);
    }
  } catch {}
  let playedMatchesWeek = 0;
  try {
    const tourIdsQ = await supabase.from("tournaments").select("id").eq("group_id", groupId).limit(200);
    const ids = (tourIdsQ.data ?? []).map((x: any) => x.id).filter(Boolean);
    if (ids.length) {
      const mq = await supabase
        .from("tournament_matches")
        .select("id", { count: "exact", head: true })
        .in("tournament_id", ids)
        .eq("status", "played")
        .gte("played_at", prev7.toISOString())
        .lt("played_at", now.toISOString());
      if (!mq.error) playedMatchesWeek = mq.count ?? 0;
    }
  } catch {}

  let openDebts = 0;
  try {
    const dq = await supabase
      .from("finance_debts")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "open");
    if (!dq.error) openDebts = dq.count ?? 0;
  } catch {}

  let newMembersMonth = 0;
  try {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const nq = await supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .gte("created_at", monthAgo.toISOString());
    if (!nq.error) newMembersMonth = nq.count ?? 0;
  } catch {}

  return (
    <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-28 pt-8">
      {(sp.saved || sp.joined) && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {sp.saved && <div>Guardado ✅</div>}
          {sp.joined && <div>Te has unido ✅</div>}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <Link className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm" href="/app/groups" aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm"
            href={`/app/groups?inviteGroup=${groupId}`}
            aria-label="Invitar"
            title="Invitar"
          >
            <UserPlus className="h-5 w-5" />
          </Link>
          <Link
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm"
            href={`/app/groups/${groupId}/settings`}
            aria-label="Ajustes"
            title="Ajustes"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-2xl font-bold">{group.name}</div>
        <div className="mt-1 text-sm text-slate-500">
          {membersCount} miembros · <span className="capitalize">{(group as any).activity ?? "otro"}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {statCard("Miembros", membersCount, "En el grupo", "green")}
        {statCard("Próximos", upcomingCount, "Eventos", "blue")}
        {statCard("Torneos", tournamentsCount, "Total", "amber")}
      </div>

      {/* Resumen semanal */}
      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-bold">Resumen Semanal</div>
            <div className="text-xs text-slate-500">Últimos 7 días / Próximos 7 días</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
            <div className="text-sm font-bold text-emerald-700">{upcomingCount}</div>
            <div className="mt-1 text-[11px] font-semibold text-emerald-700">Eventos (próx.)</div>
          </div>
          <div className="rounded-2xl bg-amber-50 p-3 text-center">
            <div className="text-sm font-bold text-amber-700">{playedMatchesWeek}</div>
            <div className="mt-1 text-[11px] font-semibold text-amber-700">Partidos (jug.)</div>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 text-center">
            <div className="text-sm font-bold text-blue-700">{openDebts}</div>
            <div className="mt-1 text-[11px] font-semibold text-blue-700">Deudas</div>
          </div>
          <div className="rounded-2xl bg-purple-50 p-3 text-center">
            <div className="text-sm font-bold text-purple-700">{newMembersMonth}</div>
            <div className="mt-1 text-[11px] font-semibold text-purple-700">Nuevos (mes)</div>
          </div>
        </div>
      </section>

      {/* FAB: ir al calendario (móvil) */}
      <Link
        href={`/app/groups/${groupId}/calendar`}
        className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600"
        aria-label="Calendario"
        title="Calendario"
      >
        <CalendarDays className="h-6 w-6" />
      </Link>
    </main>
  );
}