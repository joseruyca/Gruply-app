"use server";

import { revalidatePath } from "next/cache";
import { setAgendaRsvp } from "./repo";
import { RSVPOrNone } from "@/lib/events/repo";

export async function agendaRsvpAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const rsvp = String(formData.get("rsvp") ?? "none") as RSVPOrNone;
  if (!eventId) return;

  await setAgendaRsvp({ eventId, rsvp });

  revalidatePath("/app/agenda");
}