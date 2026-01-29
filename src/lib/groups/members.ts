import { createClient } from "@/lib/supabase/server";

export type MemberRow = {
  user_id: string;
  role: "admin" | "member";
  full_name: string | null;
  joined_at: string;
};

export async function listGroupMembers(groupId: string): Promise<MemberRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at, profiles:profiles(full_name)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    user_id: r.user_id,
    role: r.role,
    joined_at: r.joined_at,
    full_name: r.profiles?.full_name ?? null,
  }));
}

export async function myRoleInGroup(groupId: string): Promise<"admin" | "member" | null> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", uid)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.role as any) ?? null;
}