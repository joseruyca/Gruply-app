"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getOrigin() {
  // En server actions, usamos el origin por env si existe, y fallback
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function signInWithPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) redirect(`/login?e=${encodeURIComponent("Falta email o contraseña")}`);

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?e=${encodeURIComponent(error.message)}`);

  redirect("/app");
}

export async function signUpWithPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || password.length < 6) {
    redirect(`/login?e=${encodeURIComponent("Email o contraseña inválidos (mínimo 6 caracteres)")}`);
  }

  const supabase = await createClient();
  const origin = getOrigin();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Si tienes confirm-email ON, el usuario recibirá email.
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) redirect(`/login?e=${encodeURIComponent(error.message)}`);

  // Si confirm email está ON, quizá no tendrás sesión aún.
  redirect(`/login?m=${encodeURIComponent("Revisa tu email para confirmar la cuenta (si está activado).")}`);
}

export async function sendMagicLinkAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect(`/login?e=${encodeURIComponent("Pon tu email")}`);

  const supabase = await createClient();
  const origin = getOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) redirect(`/login?e=${encodeURIComponent(error.message)}`);

  redirect(`/login?m=${encodeURIComponent("Te he enviado un enlace para iniciar sesión (magic link).")}`);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

