"use server";

import { revalidatePath } from "next/cache";
import { setRsvp, RSVPOrNone } from "@/lib/events/repo";

export async function groupEventRsvpAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const rsvp = String(formData.get("rsvp") ?? "none") as RSVPOrNone;
  if (!groupId || !eventId) return;

  await setRsvp({ eventId, rsvp });

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath("/app/agenda");
}