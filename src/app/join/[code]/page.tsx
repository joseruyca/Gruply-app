import Link from "next/link";
import { acceptInviteAction } from "./actions";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return (
    <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-24 pt-10">
      <div className="text-2xl font-bold">Unirse al grupo</div>
      <div className="mt-2 text-sm text-slate-600">
        Código: <span className="font-mono font-semibold">{code}</span>
      </div>

      <form action={acceptInviteAction.bind(null, code)} className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
        <button className="h-11 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600">
          Unirme
        </button>
        <div className="mt-3 text-xs text-slate-500">
          Si no estás logueado, te pedirá iniciar sesión.
        </div>
      </form>

      <div className="mt-4">
        <Link className="text-sm font-semibold text-emerald-600 underline" href="/app/groups">
          {"\u2190"} Volver a GRUPLY
        </Link>
      </div>
    </main>
  );
}