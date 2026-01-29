import { createClient } from "@/lib/supabase/server";

export async function getGroupOrNull(groupId: string) {
  const supabase = await createClient();

  // RLS: solo devuelve si el usuario es miembro
  const { data, error } = await supabase
    .from("groups")
    .select("id,name,activity,emoji,currency,created_by,created_at")
    .eq("id", groupId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function getGroupMemberCount(groupId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}