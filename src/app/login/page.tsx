import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { login, signup } from "./actions";
import OAuthButtons from "./OAuthButtons";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ check?: string; e?: string }> }) {
  const sp = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/app/groups");

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl md:max-w-2xl lg:max-w-5xl flex-col px-5 py-10">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mt-2 text-sm text-slate-600">Email + contraseña, o Google.</p>

      {sp.check === "1" && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Te enviamos un email de confirmación. Ábrelo y confirma.
        </div>
      )}

      {sp.e && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          Error: {sp.e}
        </div>
      )}

      <form className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Email
          <input name="email" type="email" required className="h-11 rounded-2xl border border-slate-200 bg-white px-3" />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Contraseña
          <input name="password" type="password" required className="h-11 rounded-2xl border border-slate-200 bg-white px-3" />
        </label>

        <button formAction={login} className="mt-2 h-11 rounded-2xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600">
          Iniciar sesión
        </button>

        <button formAction={signup} className="h-11 rounded-2xl border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50">
          Crear cuenta
        </button>

        <div className="mt-1 flex items-center justify-between">
          <Link className="text-sm font-semibold text-emerald-600 underline" href="/forgot">
            ¿Has olvidado tu contraseña?
          </Link>
          <Link className="text-sm font-semibold text-slate-500 underline" href="/">
            Volver
          </Link>
        </div>
      </form>

      <OAuthButtons />
    </main>
  );
}