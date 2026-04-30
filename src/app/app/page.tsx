import Link from "next/link";
import { redirect } from "next/navigation";
import InstallPWAButton from "@/components/InstallPWAButton";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight } from "lucide-react";

export default async function AppEntryPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  // ✅ Si está logueado, va directo a grupos
  if (user) redirect("/app/groups");

  // ✅ Si NO, mostramos la “puerta de entrada” a la app
  return (
    <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-24 pt-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-2xl font-black text-slate-900">GRUPLY</div>
        <div className="mt-1 text-sm text-slate-600">Entra o instala la app en el móvil.</div>

        <div className="mt-5 grid gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 sm:px-6 lg:px-8 py-3 text-sm font-extrabold text-white hover:bg-emerald-700"
          >
            Entrar
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
          >
            Crear cuenta
          </Link>

          <InstallPWAButton className="w-full" label="Descargar app" />
        </div>

        <div className="mt-4 text-[11px] text-slate-500">
          Si ya tienes sesión, te llevará automático a tus grupos.
        </div>
      </div>
    </main>
  );
}