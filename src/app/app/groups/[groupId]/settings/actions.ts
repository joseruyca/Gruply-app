"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function cleanText(x: unknown, max = 80) {
  return String(x ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function updateGroupAction(formData: FormData) {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me?.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const groupId = String(formData.get("group_id") ?? "");
  if (!groupId) throw new Error("missing_group_id");

  const name = cleanText(formData.get("name"), 60) || "Grupo";
  const emoji = cleanText(formData.get("emoji"), 8) || "Y'";
  const description = cleanText(formData.get("description"), 140);

  const { error } = await supabase
    .from("groups")
    .update({ name, emoji, description } as any)
    .eq("id", groupId);

  if (error) throw new Error(error.message);

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/settings`);
  redirect(`/app/groups/${groupId}/settings?saved=1`);
}

export async function leaveGroupAction(formData: FormData) {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me?.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const groupId = String(formData.get("group_id") ?? "");
  if (!groupId) throw new Error("missing_group_id");

  // Si soy el único admin y hay más miembros, bloqueamos (hay que transferir admin primero)
  const { data: members, error: mErr } = await supabase
    .from("group_members")
    .select("user_id, role")
    .eq("group_id", groupId);

  if (mErr) throw new Error(mErr.message);

  const list = members ?? [];
  const myRole = list.find((m: any) => m.user_id === uid)?.role ?? "member";
  const adminCount = list.filter((m: any) => m.role === "admin").length;
  if (myRole === "admin" && adminCount <= 1 && list.length > 1) {
    throw new Error(
      "Eres el único admin. Antes de salir, asigna a otro miembro como admin."
    );
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", uid);

  if (error) throw new Error(error.message);

  revalidatePath("/app/groups");
  redirect("/app/groups?left=1");
}

export async function deleteGroupAction(formData: FormData) {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me?.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const groupId = String(formData.get("group_id") ?? "");
  if (!groupId) throw new Error("missing_group_id");

  // Solo admins
  const { data: meRow, error: rErr } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", uid)
    .maybeSingle();

  if (rErr) throw new Error(rErr.message);
  if (meRow?.role !== "admin") throw new Error("No tienes permisos.");

  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw new Error(error.message);

  revalidatePath("/app/groups");
  redirect("/app/groups?deleted=1");
}

export async function setMemberRoleAction(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  const targetUserId = String(formData.get("target_user_id") ?? "");
  const nextRole = String(formData.get("role") ?? "");

  if (!groupId || !targetUserId) throw new Error("missing_params");
  if (nextRole !== "admin" && nextRole !== "member") throw new Error("invalid_role");

  const supabase = await createClient();
  const { data: me, error: meErr } = await supabase.auth.getUser();
  if (meErr) throw new Error(meErr.message);
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  // Ensure actor is admin
  const { data: myRow, error: myErr } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", uid)
    .maybeSingle();
  if (myErr) throw new Error(myErr.message);
  if ((myRow as any)?.role !== "admin") throw new Error("not_admin");

  // Prevent removing admin from group creator
  const { data: g, error: gErr } = await supabase.from("groups").select("created_by").eq("id", groupId).maybeSingle();
  if (gErr) throw new Error(gErr.message);
  const creatorId = (g as any)?.created_by ?? null;
  if (nextRole !== "admin" && creatorId && targetUserId === creatorId) {
    throw new Error("cannot_demote_creator");
  }

  // If demoting, ensure at least one other admin remains
  if (nextRole !== "admin") {
    const { count, error: cErr } = await supabase
      .from("group_members")
      .select("user_id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);
    const adminCount = Number(count ?? 0);
    const isTargetCurrentlyAdmin = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .maybeSingle();
    const targetRole = (isTargetCurrentlyAdmin.data as any)?.role;
    if (targetRole === "admin" && adminCount <= 1) throw new Error("last_admin");
  }

  const { error: uErr } = await supabase
    .from("group_members")
    .update({ role: nextRole })
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);
  if (uErr) throw new Error(uErr.message);

  revalidatePath(`/app/groups/${groupId}/settings`);
  redirect(`/app/groups/${groupId}/settings?updated=1`);
}

// Dar/quitar permisos para gestionar torneos a un miembro.
// (Admin siempre puede; este permiso es para miembros normales.)
export async function setMemberTournamentPermAction(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  const targetUserId = String(formData.get("target_user_id") ?? "");
  const enabled = String(formData.get("enabled") ?? "0") === "1";

  if (!groupId || !targetUserId) throw new Error("missing_params");

  const supabase = await createClient();
  const { data: me, error: meErr } = await supabase.auth.getUser();
  if (meErr) throw new Error(meErr.message);
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  // Actor must be admin
  const { data: myRow, error: myErr } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", uid)
    .maybeSingle();
  if (myErr) throw new Error(myErr.message);
  if ((myRow as any)?.role !== "admin") throw new Error("not_admin");

  // No tiene sentido activar el permiso si ya es admin (pero permitir desactivar si estaba a true)
  const { data: targetRow } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .maybeSingle();
  if ((targetRow as any)?.role === "admin" && enabled) {
    revalidatePath(`/app/groups/${groupId}/settings`);
    redirect(`/app/groups/${groupId}/settings?updated=1`);
  }

  const { error } = await supabase
    .from("group_members")
    .update({ can_manage_tournaments: enabled } as any)
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  if (error) {
    const msg = String(error.message || "").toLowerCase();
    if (msg.includes("can_manage_tournaments") && msg.includes("does not exist")) {
      throw new Error("Falta la columna can_manage_tournaments. Ejecuta SUPABASE_SQL_10_TOURNAMENT_PERMS.sql en Supabase.");
    }
    throw new Error(error.message);
  }

  revalidatePath(`/app/groups/${groupId}/settings`);
  revalidatePath(`/app/groups/${groupId}/tournaments`);
  redirect(`/app/groups/${groupId}/settings?updated=1`);
}
