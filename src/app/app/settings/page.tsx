import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateProfileAction, signOutAction } from "./actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id ?? null;

  let fullName = "";
  if (uid) {
    const { data: p } = await supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle();
    fullName = String(p?.full_name ?? "");
  }

  return (
    <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-24 pt-8">
      <div className="flex items-center justify-between">
        <Link className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm" href="/app/groups" aria-label="Volver">
          {"\u2190"}
        </Link>
        <div className="text-lg font-bold">Ajustes</div>
        <div className="w-10" />
      </div>

      {sp.saved && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Guardado ??"???
        </div>
      )}

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Perfil</div>
        <form action={updateProfileAction} className="mt-3 grid gap-3">
          <label className="grid gap-1 text-sm font-medium">
            Nombre visible
            <input
              name="full_name"
              defaultValue={fullName}
              placeholder="Tu nombre"
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"
            />
          </label>
          <button className="h-11 rounded-2xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600">
            Guardar
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Sesión</div>
        <form action={signOutAction} className="mt-3">
          <button className="h-11 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50">
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}