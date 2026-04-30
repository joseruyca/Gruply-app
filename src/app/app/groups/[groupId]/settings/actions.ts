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

function isUuidLike(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    x
  );
}

async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const uid = data?.user?.id ?? null;
  if (error || !uid) throw new Error("not_authenticated");
  return { supabase, uid };
}

async function requireAdminOrThrow(supabase: any, groupId: string, uid: string) {
  const { data: myRow, error } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", uid)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (myRow?.role !== "admin") throw new Error("not_admin");
}

/**
 * Útil para la UI (si lo necesitas):
 * - lista miembros
 * - tu rol
 */
export async function getMembersAction(groupId: string) {
  if (!groupId || !isUuidLike(groupId)) return { ok: false, error: "invalid_group_id" };

  const { supabase, uid } = await requireUser();

  const { data, error } = await supabase
    .from("group_members")
    .select("user_id, role, can_manage_tournaments")
    .eq("group_id", groupId);

  if (error) return { ok: false, error: error.message };

  const myRole = (data ?? []).find((m: any) => m.user_id === uid)?.role ?? null;
  return { ok: true, members: data ?? [], myRole };
}

export async function updateGroupAction(formData: FormData) {
  const { supabase, uid } = await requireUser();

  const groupId = String(formData.get("group_id") ?? "");
  if (!groupId || !isUuidLike(groupId)) throw new Error("missing_or_invalid_group_id");

  // Solo admin debería poder editar (si no, te lo bloqueará RLS igualmente)
  // Pero lo comprobamos para UX clara:
  await requireAdminOrThrow(supabase, groupId, uid);

  const name = cleanText(formData.get("name"), 60) || "Grupo";
  const emoji = cleanText(formData.get("emoji"), 8) || "👥";
  const descriptionRaw = cleanText(formData.get("description"), 140);
  const description = descriptionRaw ? descriptionRaw : null;

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
  const { supabase, uid } = await requireUser();

  const groupId = String(formData.get("group_id") ?? "");
  if (!groupId || !isUuidLike(groupId)) throw new Error("missing_or_invalid_group_id");

  // Si soy el único admin y hay más miembros, bloqueamos (transferir admin primero)
  const { data: members, error: mErr } = await supabase
    .from("group_members")
    .select("user_id, role")
    .eq("group_id", groupId);

  if (mErr) throw new Error(mErr.message);

  const list = members ?? [];
  const myRole = list.find((m: any) => m.user_id === uid)?.role ?? "member";
  const adminCount = list.filter((m: any) => m.role === "admin").length;

  if (myRole === "admin" && adminCount <= 1 && list.length > 1) {
    // Mejor que throw: vuelve a settings con error visible
    redirect(`/app/groups/${groupId}/settings?e=last_admin_cannot_leave`);
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
  const { supabase, uid } = await requireUser();

  const groupId = String(formData.get("group_id") ?? "");
  if (!groupId || !isUuidLike(groupId)) throw new Error("missing_or_invalid_group_id");

  // Solo admins
  await requireAdminOrThrow(supabase, groupId, uid);

  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw new Error(error.message);

  revalidatePath("/app/groups");
  redirect("/app/groups?deleted=1");
}

export async function setMemberRoleAction(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  const targetUserId = String(formData.get("target_user_id") ?? "");
  const nextRole = String(formData.get("role") ?? "");

  if (!groupId || !isUuidLike(groupId)) throw new Error("missing_or_invalid_group_id");
  if (!targetUserId || !isUuidLike(targetUserId)) throw new Error("missing_or_invalid_target_user");
  if (nextRole !== "admin" && nextRole !== "member") throw new Error("invalid_role");

  const { supabase, uid } = await requireUser();

  // Actor must be admin
  await requireAdminOrThrow(supabase, groupId, uid);

  // No degradar al creador (si existe created_by)
  const { data: g, error: gErr } = await supabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .maybeSingle();
  if (gErr) throw new Error(gErr.message);

  const creatorId = (g as any)?.created_by ?? null;
  if (nextRole !== "admin" && creatorId && targetUserId === creatorId) {
    redirect(`/app/groups/${groupId}/settings?e=cannot_demote_creator`);
  }

  // Si estamos degradando a member, asegurar que no dejamos 0 admins
  if (nextRole !== "admin") {
    const { data: targetRow, error: tErr } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (tErr) throw new Error(tErr.message);
    const targetRole = (targetRow as any)?.role ?? "member";

    if (targetRole === "admin") {
      const { count, error: cErr } = await supabase
        .from("group_members")
        .select("user_id", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("role", "admin");

      if (cErr) throw new Error(cErr.message);
      const adminCount = Number(count ?? 0);

      if (adminCount <= 1) {
        redirect(`/app/groups/${groupId}/settings?e=last_admin`);
      }
    }
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

export async function removeMemberAction(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  const targetUserId = String(formData.get("target_user_id") ?? "");

  if (!groupId || !isUuidLike(groupId)) throw new Error("missing_or_invalid_group_id");
  if (!targetUserId || !isUuidLike(targetUserId)) throw new Error("missing_or_invalid_target_user");

  const { supabase, uid } = await requireUser();

  // Solo admin
  await requireAdminOrThrow(supabase, groupId, uid);

  // No expulsar al creador (opcional pero recomendable)
  const { data: g } = await supabase.from("groups").select("created_by").eq("id", groupId).maybeSingle();
  const creatorId = (g as any)?.created_by ?? null;
  if (creatorId && targetUserId === creatorId) {
    redirect(`/app/groups/${groupId}/settings?e=cannot_remove_creator`);
  }

  // No dejar el grupo sin admins si expulsas al último admin
  const { data: targetRow } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if ((targetRow as any)?.role === "admin") {
    const { count } = await supabase
      .from("group_members")
      .select("user_id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("role", "admin");
    if (Number(count ?? 0) <= 1) {
      redirect(`/app/groups/${groupId}/settings?e=last_admin`);
    }
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  if (error) throw new Error(error.message);

  revalidatePath(`/app/groups/${groupId}/settings`);
  redirect(`/app/groups/${groupId}/settings?updated=1`);
}

// Dar/quitar permisos para gestionar torneos a un miembro.
// (Admin siempre puede; este permiso es para miembros normales.)
export async function setMemberTournamentPermAction(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  const targetUserId = String(formData.get("target_user_id") ?? "");
  const enabled = String(formData.get("enabled") ?? "0") === "1";

  if (!groupId || !isUuidLike(groupId)) throw new Error("missing_or_invalid_group_id");
  if (!targetUserId || !isUuidLike(targetUserId)) throw new Error("missing_or_invalid_target_user");

  const { supabase, uid } = await requireUser();

  // Actor must be admin
  await requireAdminOrThrow(supabase, groupId, uid);

  // Si el target ya es admin, no hace falta habilitar (pero permitimos deshabilitar si estaba true)
  const { data: targetRow } = await supabase
    .from("group_members")
    .select("role, can_manage_tournaments")
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
      redirect(`/app/groups/${groupId}/settings?e=missing_column_can_manage_tournaments`);
    }
    throw new Error(error.message);
  }

  revalidatePath(`/app/groups/${groupId}/settings`);
  revalidatePath(`/app/groups/${groupId}/tournaments`);
  redirect(`/app/groups/${groupId}/settings?updated=1`);
}
