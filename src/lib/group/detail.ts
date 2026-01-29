import { createClient } from "@/lib/supabase/server";

function isUuid(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
}

export async function getGroupOrNull(groupId: string) {
  if (!groupId || !isUuid(groupId)) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select("id,name,activity,emoji,currency,created_by,created_at")
    .eq("id", groupId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function getGroupMemberCount(groupId: string) {
  if (!groupId || !isUuid(groupId)) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

// Para el layout: comprueba si el usuario actual es miembro del grupo.
// Usa RPC si existe; si no, hace select directo.
export async function isMember(groupId: string) {
  if (!groupId || !isUuid(groupId)) return false;

  const supabase = await createClient();

  // 1) Intento via RPC (si tienes is_group_member(gid uuid))
  try {
    const { data, error } = await supabase.rpc("is_group_member", { gid: groupId });
    if (!error && typeof data === "boolean") return data;
  } catch {}

  // 2) Fallback via select directo
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return false;

  const { data, error } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", uid)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}