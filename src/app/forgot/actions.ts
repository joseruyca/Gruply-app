"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function origin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export async function sendReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();

  // IMPORTANTE: recovery DEBE volver por /auth/callback
  const redirectTo = `${origin()}/auth/callback?type=recovery`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) redirect(`/error?m=${encodeURIComponent(error.message)}`);

  redirect("/forgot?sent=1");
}

export async function resendConfirm(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();

  const emailRedirectTo = `${origin()}/auth/callback`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });

  if (error) redirect(`/error?m=${encodeURIComponent(error.message)}`);

  redirect("/forgot?resent=1");
}