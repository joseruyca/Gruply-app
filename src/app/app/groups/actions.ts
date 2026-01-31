"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeText(x: any, max = 80) {
  return String(x ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function safeEmoji(x: any) {
  // Nos quedamos con 1–2 “graphemes” típicos de emojis; si viene basura -> fallback
  const raw = String(x ?? "").trim();
  if (!raw) return "👥";
  // Evita textos corruptos tipo "ðŸ..."
  if (raw.includes("ðŸ") || raw.includes("Ã") || raw.includes("�")) return "👥";
  return raw.slice(0, 8); // suficiente para emojis con variaciones
}

function makeCode(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function requireUserOrRedirect() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  const uid = data?.user?.id ?? null;
  if (!uid || error) {
    // Mejor UX y evita “misterios” en otros dispositivos:
    redirect("/login?e=auth_required");
  }

  return { supabase, uid };
}

export async function createGroupAction(formData: FormData) {
  const name = safeText(formData.get("name"), 50);
  const activity = safeText(formData.get("activity"), 30) || "otro";
  const emoji = safeEmoji(formData.get("emoji"));
  const descriptionRaw = safeText(formData.get("description"), 140);
  const description = descriptionRaw ? descriptionRaw : null;

  if (!name) {
    redirect("/app/groups?e=missing_name");
  }

  const { supabase, uid } = await requireUserOrRedirect();

  // 1) Crear grupo
  const { data: group, error: e1 } = await supabase
    .from("groups")
    .insert({
      name,
      activity,
      emoji,
      description,
      currency: "EUR",
      created_by: uid,
    })
    .select("id")
    .single();

  if (e1 || !group?.id) {
    // Esto te dirá si es RLS, campos, etc. en logs de Vercel
    throw new Error(`[createGroupAction.groups] ${e1?.message ?? "unknown_error"}`);
  }

  // 2) Meter al creador como admin
  const { error: e2 } = await supabase.from("group_members").upsert(
    { group_id: group.id, user_id: uid, role: "admin" },
    { onConflict: "group_id,user_id" }
  );

  if (e2) {
    throw new Error(`[createGroupAction.members] ${e2.message}`);
  }

  revalidatePath("/app/groups");
  // Si quieres que entre directo al grupo recién creado:
  redirect(`/app/groups/${group.id}?created=1`);
  // Si prefieres volver al listado:
  // redirect("/app/groups?created=1");
}

export async function createInviteAction(formData: FormData) {
  const groupId = safeText(formData.get("groupId"), 80);
  if (!groupId) {
    redirect("/app/groups?e=missing_groupId");
  }

  const { supabase, uid } = await requireUserOrRedirect();

  const code = makeCode(10);

  const { error } = await supabase.from("invites").insert({
    group_id: groupId,
    code,
    created_by: uid,
  });

  if (error) {
    throw new Error(`[createInviteAction.invites] ${error.message}`);
  }

  revalidatePath("/app/groups");
  redirect(`/app/groups?invite=${code}`);
}
