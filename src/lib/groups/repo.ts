import { createClient } from "@/lib/supabase/server";

export type GroupRow = {
  id: string;
  name: string;
  activity: string;
  emoji: string | null;
  currency: string;
};

export async function listMyGroups(): Promise<GroupRow[]> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return [];

  // RLS: solo veremos grupos donde somos miembros
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id, groups:groups(id,name,activity,emoji,currency)")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((r: any) => r.groups)
    .filter(Boolean)
    .map((g: any) => ({
      id: g.id,
      name: g.name,
      activity: g.activity,
      emoji: g.emoji ?? null,
      currency: g.currency,
    }));
}

export async function createGroup(input: {
  name: string;
  activity: string;
  emoji?: string;
  currency?: string;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", {
    p_name: input.name,
    p_activity: input.activity,
    p_emoji: input.emoji ?? null,
    p_currency: input.currency ?? "EUR",
  });

  if (error) throw new Error(error.message);
  return String(data);
}

export async function createInvite(groupId: string, code: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_invite", {
    p_group_id: groupId,
    p_code: code,
    p_code_numeric: null,
    p_expires_at: null,
    p_max_uses: 100,
  });

  if (error) throw new Error(error.message);
  return String(data);
}

export async function joinByCode(code: string, fullName: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_group_by_code", {
    p_code: code,
    p_full_name: fullName,
  });

  if (error) throw new Error(error.message);
  return String(data);
}