"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeText(x: any, max = 80) {
  return String(x ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function makeCode(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function createGroupAction(formData: FormData) {
  const name = safeText(formData.get("name"), 50);
  const activity = safeText(formData.get("activity"), 30) || "otro";
  const emoji = safeText(formData.get("emoji"), 8) || "👥";
  const description = safeText(formData.get("description"), 140) || null;

  if (!name) throw new Error("missing_name");

  const supabase = await createClient();
  const { data: me, error: meErr } = await supabase.auth.getUser();
  if (meErr) throw new Error(meErr.message);

  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const { data: group, error: e1 } = await supabase
    .from("groups")
    .insert({
      name,
      activity,
      emoji,
      description,
      currency: "EUR",
      created_by: uid,
    })
    .select("id")
    .single();

  if (e1) throw new Error(e1.message);
  if (!group?.id) throw new Error("group_not_created");

  const { error: e2 } = await supabase
    .from("group_members")
    .upsert({ group_id: group.id, user_id: uid, role: "admin" }, { onConflict: "group_id,user_id" });

  if (e2) throw new Error(e2.message);

  revalidatePath("/app/groups");
  redirect("/app/groups?created=1");
}

export async function createInviteAction(formData: FormData) {
  const groupId = safeText(formData.get("groupId"), 80);
  if (!groupId) throw new Error("missing_groupId");

  const supabase = await createClient();
  const { data: me, error: meErr } = await supabase.auth.getUser();
  if (meErr) throw new Error(meErr.message);

  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const code = makeCode(10);

  const { error } = await supabase.from("invites").insert({
    group_id: groupId,
    code,
    created_by: uid,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/app/groups");
  redirect(`/app/groups?invite=${code}`);
}
