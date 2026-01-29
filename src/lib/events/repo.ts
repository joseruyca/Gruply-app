import { createClient } from "@/lib/supabase/server";

export type RSVP = "yes" | "maybe" | "no";
export type RSVPOrNone = RSVP | "none";
const RSVP_SET = new Set<RSVP>(["yes", "maybe", "no"]);

export type EventRow = {
  id: string;
  group_id: string;
  title: string;
  place: string | null;
  starts_at: string;
  notes: string | null;
  capacity: number | null;
  status: string;
  created_by: string;
  created_at: string;
};

function isUuid(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
}

/**
 * Lista próximos eventos de un grupo (usa RLS: solo miembros verán datos).
 */
export async function listUpcomingForGroup(groupId: string, days: number = 60) {
  if (!groupId || !isUuid(groupId)) return [];

  // days robusto
  const d = Number(days);
  const safeDays = Number.isFinite(d) ? Math.min(Math.max(d, 1), 365) : 60;

  const supabase = await createClient();

  const now = Date.now();
  const fromDate = new Date(now - 24 * 60 * 60 * 1000);
  const toDate = new Date(now + safeDays * 24 * 60 * 60 * 1000);

  const fromIso = Number.isFinite(fromDate.getTime())
    ? fromDate.toISOString()
    : new Date().toISOString();

  const toIso = Number.isFinite(toDate.getTime())
    ? toDate.toISOString()
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id,group_id,title,place,starts_at,notes,capacity,status,created_by,created_at")
    .eq("group_id", groupId)
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as EventRow[];
}


/**
 * Alias por compatibilidad: algunos pages importan listUpcomingEvents
 */
export const listUpcomingEvents = listUpcomingForGroup;

/**
 * Crea evento (el grupo + miembro se controla por RLS/policies).
 */
export async function createEvent(input: {
  groupId: string;
  title: string;
  startsAt: string; // ISO
  place?: string;
  notes?: string;
  capacity?: number | null;
}) {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const groupId = input.groupId;
  if (!groupId || !isUuid(groupId)) throw new Error("invalid_group");

  const title = String(input.title ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!title) throw new Error("missing_title");

  const startsAt = String(input.startsAt ?? "").trim();
  if (!startsAt) throw new Error("missing_starts_at");

  const row = {
    group_id: groupId,
    title,
    starts_at: startsAt,
    place: input.place ? String(input.place).trim().slice(0, 80) : null,
    notes: input.notes ? String(input.notes).trim().slice(0, 500) : null,
    capacity: input.capacity ?? null,
    status: "published",
    created_by: uid,
  };

  const { data, error } = await supabase.from("events").insert(row).select("id").maybeSingle();
  if (error) throw new Error(error.message);

  return data?.id ?? null;
}

/**
 * Devuelve MIS RSVPs para una lista de eventos: { [eventId]: "yes"|"maybe"|"no" }
 */
export async function getMyRsvpsForEvents(eventIds: string[]) {
  const ids = (eventIds ?? []).filter((x) => !!x && isUuid(x));
  if (ids.length === 0) return {} as Record<string, RSVP>;

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return {} as Record<string, RSVP>;

  const { data, error } = await supabase
    .from("event_rsvps")
    .select("event_id,rsvp")
    .eq("user_id", uid)
    .in("event_id", ids);

  if (error) throw new Error(error.message);

  const out: Record<string, RSVP> = {};
  for (const r of data ?? []) {
    if (r?.event_id && RSVP_SET.has(r.rsvp as RSVP)) out[r.event_id] = r.rsvp as RSVP;
  }
  return out;
}

/**
 * Set RSVP:
 * - rsvp: "yes"|"maybe"|"no" => upsert
 * - rsvp: "none" => delete
 */
export async function setRsvp(input: { eventId: string; rsvp: RSVP | "none" }) {
  const eventId = String(input.eventId ?? "").trim();
  const rsvp = String(input.rsvp ?? "").trim() as any;

  if (!eventId || !isUuid(eventId)) throw new Error("invalid_event");

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  // Validación suave: que el evento exista (RLS hará el resto)
  const { data: ev, error: e0 } = await supabase.from("events").select("id").eq("id", eventId).maybeSingle();
  if (e0) throw new Error(e0.message);
  if (!ev) throw new Error("invalid_event");

  if (rsvp === "none") {
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", uid);

    if (error) throw new Error(error.message);
    return;
  }

  if (!RSVP_SET.has(rsvp)) throw new Error("invalid_rsvp");

  const { error } = await supabase
    .from("event_rsvps")
    .upsert({ event_id: eventId, user_id: uid, rsvp }, { onConflict: "event_id,user_id" });

  if (error) throw new Error(error.message);
}
