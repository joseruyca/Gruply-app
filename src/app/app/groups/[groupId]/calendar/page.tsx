import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupOrNull } from "@/lib/group/detail";
import { getMyRsvpsForEvents } from "@/lib/events/repo";
import CalendarClient from "./CalendarClient";

export default async function GroupCalendarPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
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

  // Cargamos un rango amplio para que la vista de mes siempre tenga datos
  // (y para que puedas ver/crear eventos sin depender de “próximos”).
  const nowMs = Date.now();
  const fromIso = new Date(nowMs - 120 * 24 * 60 * 60 * 1000).toISOString();
  const toIso = new Date(nowMs + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id,title,starts_at,place,status,created_by")
    .eq("group_id", groupId)
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at", { ascending: true })
    .limit(500);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-24 pt-8">
        <Link className="text-sm font-semibold text-emerald-600 underline" href={`/app/groups/${groupId}`}>
          {"\u2190"} Volver
        </Link>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Error cargando eventos: {error.message}
        </div>
      </main>
    );
  }

  const events = (data ?? []).map((e: any) => ({
    id: String(e.id),
    title: e.title ?? "",
    starts_at: e.starts_at,
    place: e.place ?? null,
    status: e.status ?? "published",
    created_by: e.created_by ?? null,
  }));

  const rsvps = await getMyRsvpsForEvents(events.map((e) => e.id));

  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id ?? null;

  // UI: permitir crear eventos si eres miembro **o** creador del grupo.
  let canCreate = false;
  if (uid) {
    const isOwner = uid === (group as any)?.created_by;
    canCreate = isOwner;

    try {
      const { data: m } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("user_id", uid)
        .maybeSingle();
      canCreate = canCreate || !!m;
    } catch {
      // Si la tabla está protegida por RLS y falla el select, al menos el dueño puede crear.
      canCreate = isOwner;
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pt-6">
        <Link className="text-sm font-semibold text-emerald-600 underline" href={`/app/groups/${groupId}`}>
          {"\u2190"} Volver al grupo
        </Link>
      </div>

      <CalendarClient
        groupId={groupId}
        groupName={group.name ?? "Grupo"}
        groupEmoji={(group as any).emoji ?? null}
        canCreate={canCreate}
        initialEvents={events as any}
        initialRsvps={rsvps as any}
      />
    </>
  );
}