"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function parseHashTokens() {
  // Supabase recovery a menudo llega como:
  // http://localhost:3000/reset-password#access_token=...&refresh_token=...&type=recovery
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  if (!hash || hash.length < 2) return null;

  const params = new URLSearchParams(hash.slice(1));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const type = params.get("type");

  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token, type };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      setMsg(null);

      // 1) intenta sesión normal
      const s1 = await supabase.auth.getSession();
      if (s1.data.session) {
        if (!cancelled) setReady(true);
        return;
      }

      // 2) si no hay, intenta crearla desde el hash
      const tokens = parseHashTokens();
      if (tokens?.access_token && tokens?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });

        // limpia el hash (evita reuso / confusiones)
        try {
          window.history.replaceState({}, "", window.location.pathname);
        } catch {}

        if (error) {
          if (!cancelled) setMsg("No se pudo crear sesión desde el enlace. Pide otro email de recuperación.");
          if (!cancelled) setReady(false);
          return;
        }

        const s2 = await supabase.auth.getSession();
        if (s2.data.session) {
          if (!cancelled) setReady(true);
          return;
        }
      }

      if (!cancelled) {
        setMsg("Sesión no disponible. Vuelve a pedir el email de recuperación (usa siempre el último enlace).");
        setReady(false);
      }
    }

    ensureSession();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!pw || pw.length < 8) {
      setMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (pw !== pw2) {
      setMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      // asegura que hay sesión justo antes de update
      const s = await supabase.auth.getSession();
      if (!s.data.session) {
        setMsg("Auth session missing. Vuelve a pedir el email de recuperación y usa el último enlace.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) {
        setMsg(error.message);
        return;
      }

      // listo: al dashboard
      router.push("/app/groups");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl md:max-w-2xl lg:max-w-5xl flex-col px-5 py-10">
      <h1 className="text-2xl font-bold">Nueva contraseña</h1>
      <p className="mt-2 text-sm text-slate-600">Introduce tu nueva contraseña.</p>

      {msg && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {msg}
        </div>
      )}

      {!ready && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          Esperando sesión desde el enlace ·
          <div className="mt-2">
            <a className="font-semibold text-emerald-600 underline" href="/forgot">
              Pedir otro enlace
            </a>
          </div>
        </div>
      )}

      <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm font-medium">
          Nueva contraseña
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            type="password"
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3"
            disabled={!ready || loading}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Repite contraseña
          <input
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            type="password"
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3"
            disabled={!ready || loading}
          />
        </label>

        <button
          disabled={!ready || loading}
          className="mt-2 h-11 rounded-2xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          Guardar
        </button>
      </form>
    </main>
  );
}