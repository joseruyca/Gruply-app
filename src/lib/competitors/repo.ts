import { createClient } from "@/lib/supabase/server";
import { listGroupMembers } from "@/lib/members/repo";

export type CompetitorType = "pair" | "team";

export type GroupCompetitor = {
  id: string;
  group_id: string;
  type: CompetitorType;
  name: string;
  created_by?: string | null;
  created_at?: string | null;
};

export type CompetitorMember = {
  user_id: string;
  full_name: string;
};

export type CompetitorWithMembers = GroupCompetitor & {
  members: CompetitorMember[];
};

async function requireAuth() {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");
  return { supabase, uid };
}

export async function listMyCompetitors(groupId: string): Promise<GroupCompetitor[]> {
  const { supabase, uid } = await requireAuth();

  const { data, error } = await supabase
    .from("group_competitor_members")
    .select("competitor_id, group_competitors:group_competitors(id,group_id,type,name,created_by,created_at)")
    .eq("user_id", uid)
    .eq("group_competitors.group_id", groupId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((r: any) => r.group_competitors)
    .filter(Boolean)
    .map((c: any) => ({
      id: c.id,
      group_id: c.group_id,
      type: (c.type ?? "pair") as CompetitorType,
      name: String(c.name ?? ""),
      created_by: c.created_by ?? null,
      created_at: c.created_at ?? null,
    }));
}

export async function listGroupCompetitors(groupId: string): Promise<CompetitorWithMembers[]> {
  const { supabase } = await requireAuth();

  const { data: comps, error: ce } = await supabase
    .from("group_competitors")
    .select("id,group_id,type,name,created_by,created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (ce) throw new Error(ce.message);

  const compList = (comps ?? []) as any[];
  if (compList.length === 0) return [];

  const ids = compList.map((c) => c.id);

  const { data: mems, error: me } = await supabase
    .from("group_competitor_members")
    .select("competitor_id,user_id,profiles:profiles(full_name)")
    .in("competitor_id", ids);

  if (me) throw new Error(me.message);

  const byComp: Record<string, CompetitorMember[]> = {};
  for (const r of mems ?? []) {
    const cid = String((r as any).competitor_id);
    if (!byComp[cid]) byComp[cid] = [];
    byComp[cid].push({
      user_id: String((r as any).user_id),
      full_name: String((r as any).profiles?.full_name ?? "Sin nombre"),
    });
  }

  return compList.map((c) => ({
    id: c.id,
    group_id: c.group_id,
    type: (c.type ?? "pair") as CompetitorType,
    name: String(c.name ?? ""),
    created_by: c.created_by ?? null,
    created_at: c.created_at ?? null,
    members: byComp[String(c.id)] ?? [],
  }));
}

export async function createCompetitor(input: {
  groupId: string;
  type: CompetitorType;
  name: string;
  memberIds: string[];
}): Promise<string> {
  const { supabase, uid } = await requireAuth();

  const groupId = input.groupId;
  const type = (input.type ?? "pair") as CompetitorType;
  const name = String(input.name ?? "").trim().slice(0, 60);
  const memberIds = Array.from(new Set((input.memberIds ?? []).map(String).filter(Boolean)));

  if (!groupId) throw new Error("missing_group");
  if (!name) throw new Error("missing_name");

  const min = type === "pair" ? 2 : 2;
  const max = type === "pair" ? 2 : 10;
  if (memberIds.length < min || memberIds.length > max) throw new Error("invalid_member_count");

  // Seguridad extra: solo miembros del grupo pueden crear, y solo con miembros del grupo.
  const members = await listGroupMembers(groupId);
  const set = new Set(members.map((m) => m.user_id));
  if (!set.has(uid)) throw new Error("not_group_member");
  for (const mid of memberIds) if (!set.has(mid)) throw new Error("member_not_in_group");

  const { data: inserted, error } = await supabase
    .from("group_competitors")
    .insert({ group_id: groupId, type, name, created_by: uid } as any)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  const competitorId = String((inserted as any).id);

  const rows = memberIds.map((mid) => ({
    competitor_id: competitorId,
    user_id: mid,
  }));

  const { error: ie } = await supabase.from("group_competitor_members").insert(rows as any);
  if (ie) throw new Error(ie.message);

  return competitorId;
}

export async function deleteCompetitor(groupId: string, competitorId: string) {
  const { supabase, uid } = await requireAuth();
  if (!groupId || !competitorId) throw new Error("missing_ids");

  // Debes ser miembro del grupo para borrar. (Si quieres, luego lo limitamos a admins/premium)
  const members = await listGroupMembers(groupId);
  if (!members.some((m) => m.user_id === uid)) throw new Error("not_group_member");

  const { error } = await supabase
    .from("group_competitors")
    .delete()
    .eq("id", competitorId)
    .eq("group_id", groupId);

  if (error) throw new Error(error.message);
}
