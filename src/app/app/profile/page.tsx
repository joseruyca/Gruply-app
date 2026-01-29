import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main className="px-4 sm:px-6 lg:px-8 pt-12">
      <h1 className="text-2xl font-bold">Perfil</h1>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Sesión:</p>
        <p className="mt-1 font-mono text-sm text-slate-800">
          {data.user?.email ?? " · ??"}
        </p>

        <form className="mt-4">
          <button
            formAction={logout}
            className="h-11 w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}