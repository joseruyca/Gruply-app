"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Actualiza (o crea) el perfil del usuario.
 * Nota: requiere que exista una policy RLS que permita INSERT/UPDATE cuando id = auth.uid().
 */
export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: me, error: meErr } = await supabase.auth.getUser();
  if (meErr) throw new Error(meErr.message);
  const uid = me?.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const raw = String(
    formData.get("full_name") ?? formData.get("display_name") ?? ""
  )
    .replace(/\s+/g, " ")
    .trim();

  const name = raw.slice(0, 60);

  // Intentamos primero con full_name (schema típico de Supabase).
  let { error } = await supabase
    .from("profiles")
    .upsert({ id: uid, full_name: name } as any, { onConflict: "id" });

  // Si tu tabla usa display_name en vez de full_name, probamos fallback.
  if (error && /column\s+.*full_name\s+does not exist/i.test(error.message)) {
    const res2 = await supabase
      .from("profiles")
      .upsert({ id: uid, display_name: name } as any, { onConflict: "id" });
    error = res2.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/app/settings");
  revalidatePath("/app/profile");
  redirect("/app/settings?saved=1");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}