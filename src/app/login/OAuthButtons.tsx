"use client";

import { createClient } from "@/lib/supabase/client";

export default function OAuthButtons() {
  async function google() {
    const supabase = createClient();
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });

    if (error) alert(error.message);
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-slate-900">Continuar con</h2>
      <button
        onClick={google}
        className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
      >
        Google
      </button>
    </section>
  );
}
