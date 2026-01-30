"use client";

import { useMemo, useState } from "react";

type Props = {
  error?: string;
  message?: string;
};

export default function LoginForm({ error, message }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const title = useMemo(() => (mode === "signin" ? "Iniciar sesión" : "Crear cuenta"), [mode]);
  const subtitle = useMemo(
    () =>
      mode === "signin"
        ? "Entra para gestionar tus grupos, eventos, finanzas y torneos."
        : "Crea tu cuenta en 30 segundos.",
    [mode]
  );

  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">GRUPLY</h1>
            <p className="mt-1 text-sm text-slate-600">{title}</p>
          </div>

          <span className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            Beta
          </span>
        </div>

        <p className="mt-3 text-sm text-slate-600">{subtitle}</p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        {/* GOOGLE */}
        <button
          type="button"
          onClick={async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const origin = window.location.origin;
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${origin}/auth/callback` },
            });
            if (error) alert(error.message);
          }}
          className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
        >
          Continuar con Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-bold text-slate-500">o con email</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* FORM */}
        <form
          action={mode === "signin" ? "/login" : "/login"}
          className="grid gap-3"
        >
          {/* Los server actions reales se conectan en page.tsx mediante <form action={...}>.
              Aquí solo hacemos UI; page.tsx envolverá con el action correcto. */}
          <input
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
          <input
            name="password"
            type="password"
            placeholder={mode === "signin" ? "Contraseña" : "Crea una contraseña (mín. 6)"}
            required
            minLength={6}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />

          <button
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
            formAction={mode === "signin" ? "signIn" : "signUp"}
          >
            {mode === "signin" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between">
          <a className="text-sm font-semibold text-slate-600 hover:text-slate-900" href="/forgot">
            ¿Olvidaste la contraseña?
          </a>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-sm font-extrabold text-slate-900 hover:underline"
          >
            {mode === "signin" ? "Crear cuenta" : "Ya tengo cuenta"}
          </button>
        </div>
      </div>
    </main>
  );
}
