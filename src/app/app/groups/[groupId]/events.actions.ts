"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createEvent, setRsvp } from "@/lib/events/repo";

function toIsoFromLocal(date: string, time: string) {
  // date: YYYY-MM-DD, time: HH:mm (local)
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0);
  return dt.toISOString();
}

export async function createEventAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const place = String(formData.get("place") ?? "").trim();

  if (!groupId) redirect(`/error?m=${encodeURIComponent("groupId missing")}`);
  if (title.length < 2) redirect(`/error?m=${encodeURIComponent("Título demasiado corto")}`);
  if (!date || !time) redirect(`/error?m=${encodeURIComponent("Fecha/hora obligatorias")}`);

  await createEvent({
    groupId,
    title,
    startsAt: toIsoFromLocal(date, time),
    place: place || undefined,
  });

  revalidatePath(`/app/groups/${groupId}`);
  redirect(`/app/groups/${groupId}?tab=calendar`);
}

export async function rsvpAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const rsvp = String(formData.get("rsvp") ?? "") as any;

  if (!groupId || !eventId) redirect(`/error?m=${encodeURIComponent("missing ids")}`);
  if (!["yes","no","maybe"].includes(rsvp)) redirect(`/error?m=${encodeURIComponent("rsvp inválido")}`);

  await setRsvp({ eventId, rsvp });

  revalidatePath(`/app/groups/${groupId}`);
  redirect(`/app/groups/${groupId}?tab=calendar`);
}
