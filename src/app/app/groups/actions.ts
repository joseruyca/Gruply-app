"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDemoGroup } from "@/lib/demo-groups";

function safeText(x: any, max = 80) {
  return String(x ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function safeEmoji(x: any) {
  const raw = String(x ?? "").trim();
  if (!raw) return "👥";
  if (raw.includes("ðŸ") || raw.includes("Ã") || raw.includes("�")) return "👥";
  return raw.slice(0, 8);
}

function isUuidLike(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
}

function makeCode(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function getUserContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const uid = data?.user?.id ?? null;
  return { supabase, uid, authError: error };
}

export async function createGroupAction(formData: FormData) {
  const name = safeText(formData.get("name"), 50);
  const activity = safeText(formData.get("activity"), 30) || "otro";
  const emoji = safeEmoji(formData.get("emoji"));
  const descriptionRaw = safeText(formData.get("description"), 140);
  const description = descriptionRaw ? descriptionRaw : null;

  if (!name) redirect("/app/groups?e=missing_name&create=1");

  const { supabase, uid } = await getUserContext();

  if (!uid) {
    const demo = await addDemoGroup({ name, activity, emoji, description });
    revalidatePath("/app/groups");
    redirect(`/app/groups/${demo.id}?created=1&demo=1`);
  }

  const { data: group, error: e1 } = await supabase
    .from("groups")
    .insert({ name, activity, emoji, description, currency: "EUR", created_by: uid })
    .select("id")
    .single();

  if (e1 || !group?.id) {
    const demo = await addDemoGroup({ name, activity, emoji, description });
    revalidatePath("/app/groups");
    redirect(`/app/groups/${demo.id}?created=1&demo=1`);
  }

  const { error: e2 } = await supabase.from("group_members").upsert(
    { group_id: group.id, user_id: uid, role: "admin" },
    { onConflict: "group_id,user_id" }
  );

  if (e2) {
    const demo = await addDemoGroup({ name, activity, emoji, description });
    revalidatePath("/app/groups");
    redirect(`/app/groups/${demo.id}?created=1&demo=1`);
  }

  revalidatePath("/app/groups");
  redirect(`/app/groups/${group.id}?created=1`);
}

export async function createInviteAction(formData: FormData) {
  const groupId = safeText(formData.get("groupId"), 80);
  if (!groupId || !isUuidLike(groupId)) redirect("/app/groups?e=missing_or_invalid_groupId");

  const { supabase, uid } = await getUserContext();
  if (!uid) redirect("/app/groups?e=invite_requires_login");

  const code = makeCode(10);
  const { error } = await supabase.from("invites").insert({ group_id: groupId, code, created_by: uid });
  if (error) throw new Error(`[createInviteAction.invites] ${error.message}`);

  revalidatePath("/app/groups");
  revalidatePath(`/app/groups/${groupId}/settings`);
  redirect(`/app/groups/${groupId}/settings?invite=${code}`);
}
