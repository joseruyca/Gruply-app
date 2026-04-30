import { createClient } from "@/lib/supabase/server";

export type GroupMember = {
  user_id: string;
  role: "admin" | "member";
  full_name: string;
};

export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = await createClient();

  // Espera: group_members(user_id, role) y profiles(id, full_name)
  // Usamos join via select con FK profiles.id -> auth.users.id (y group_members.user_id -> profiles.id)
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id, role, profiles:profiles(full_name)")
    .eq("group_id", groupId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    user_id: r.user_id,
    role: (r.role ?? "member") as any,
    full_name: String(r.profiles?.full_name ?? "Sin nombre"),
  }));
}