"use server";

import { revalidatePath } from "next/cache";
import { createEvent, setRsvp, RSVPOrNone } from "@/lib/events/repo";

export async function calendarRsvpAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "").trim();
  const eventId = String(formData.get("eventId") ?? "").trim();
  const rsvp = String(formData.get("rsvp") ?? "").trim() as RSVPOrNone;

  if (!groupId) throw new Error("missing_groupId");
  if (!eventId) throw new Error("missing_eventId");
  if (!["yes", "maybe", "no", "none"].includes(rsvp)) throw new Error("bad_rsvp");

  await setRsvp({ eventId, rsvp });

  revalidatePath(`/app/groups/${groupId}/calendar`);
  revalidatePath("/app/agenda");
}

export async function createGroupEventAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const place = String(formData.get("place") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!groupId) throw new Error("missing_groupId");
  if (!title) throw new Error("missing_title");
  if (!startsAt) throw new Error("missing_startsAt");

  await createEvent({
    groupId,
    title,
    startsAt,
    place: place || undefined,
    notes: notes || undefined,
  });

  revalidatePath(`/app/groups/${groupId}/calendar`);
  revalidatePath("/app/agenda");
}