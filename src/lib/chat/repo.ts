import { createClient } from "@/lib/supabase/server";

export type GroupMessageRow = {
  id: string;
  group_id: string;
  user_id: string;
  message: string;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  reply_to?: string | null;
  attachment_path?: string | null;
  attachment_mime?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  profiles?: { full_name?: string | null } | null;
};

function isMissingColumnError(message: string, col: string) {
  const m = String(message || "");
  return m.includes("does not exist") && m.includes(col);
}

export async function listGroupMessages(groupId: string, limit = 60, before?: string): Promise<GroupMessageRow[]> {
  const supabase = await createClient();

  
  const baseSelect = "id, group_id, user_id, message, created_at, profiles:profiles!group_messages_user_id_profiles_fkey(full_name)";
const extraSelect =
  "id, group_id, user_id, message, created_at, edited_at, deleted_at, reply_to, attachment_path, attachment_mime, attachment_name, attachment_size, profiles:profiles!group_messages_user_id_profiles_fkey(full_name)";


  // newest first internally, then we reverse to show ascending
  const build = (select: string) => {
    let q = supabase
      .from("group_messages")
      .select(select)
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) q = q.lt("created_at", before);
    return q;
  };

  let res = await build(extraSelect);

  // Compat: si aún no has corrido la migración PRO, caemos al select básico.
  if (res.error && (isMissingColumnError(res.error.message, "edited_at") || isMissingColumnError(res.error.message, "attachment_path") || isMissingColumnError(res.error.message, "reply_to"))) {
    res = await build(baseSelect);
  }

  if (res.error) throw new Error(res.error.message);

  const rows = (res.data ?? []) as any[];
  // lo devolvemos ascendente
  return rows.reverse();
}
