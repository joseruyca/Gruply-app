import { createClient } from "@/lib/supabase/server";
import { getMyRsvpsForEvents, setRsvp, RSVP, RSVPOrNone } from "@/lib/events/repo";

export type AgendaItem = {
  event_id: string;
  group_id: string;
  group_name: string;
  group_emoji: string | null;
  title: string;
  starts_at: string;
  place: string | null;
  status: "published" | "cancelled";
  created_by: string;
};

export async function listMyAgenda(): Promise<{ items: AgendaItem[]; rsvps: Record<string, RSVP> }> {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id,group_id,title,starts_at,place,status,created_by, groups(name,emoji)")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(200);

  if (error) throw new Error(error.message);

  const items: AgendaItem[] = (data ?? []).map((r: any) => ({
    event_id: String(r.id),
    group_id: String(r.group_id),
    group_name: r.groups?.name ?? "Grupo",
    group_emoji: r.groups?.emoji ?? null,
    title: r.title ?? "",
    starts_at: r.starts_at,
    place: r.place ?? null,
    status: r.status,
    created_by: r.created_by,
  }));

  const eventIds = items.map((x) => x.event_id);
  const rsvps = await getMyRsvpsForEvents(eventIds);

  return { items, rsvps };
}

export async function setAgendaRsvp(input: { eventId: string; rsvp: RSVPOrNone }) {
  await setRsvp({ eventId: input.eventId, rsvp: input.rsvp });
}