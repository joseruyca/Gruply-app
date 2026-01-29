"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function OAuthButtons() {
  const [busy, setBusy] = useState(false);

  async function signInGoogle() {
    try {
      setBusy(true);
      const supabase = createClient();
      const origin = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 grid gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={signInGoogle}
        className="h-11 rounded-2xl border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
      >
        Continuar con Google
      </button>
    </div>
  );
}