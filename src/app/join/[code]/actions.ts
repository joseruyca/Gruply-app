"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function resolveInviteGroupId(supabase: any, code: string): Promise<string | null> {
  const tables = ["group_invites", "invites", "group_invite_links"];
  for (const t of tables) {
    try {
      const r = await supabase.from(t).select("group_id").eq("code", code).maybeSingle();
      if (!r.error && r.data?.group_id) return String(r.data.group_id);
    } catch {}
  }
  return null;
}

export async function acceptInviteAction(code: string) {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) redirect("/login");

  const groupId = await resolveInviteGroupId(supabase, code);
  if (!groupId) throw new Error("invite_not_found");

  const ins = await supabase.from("group_members").insert({ group_id: groupId, user_id: uid } as any);
  if (ins.error && String((ins.error as any).code) !== "23505") {
    throw new Error(ins.error.message);
  }

  redirect(`/app/groups/${groupId}?joined=1`);
}