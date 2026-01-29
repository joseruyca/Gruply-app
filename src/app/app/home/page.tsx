import Link from "next/link";
import { listMyGroups } from "@/lib/groups/repo";

export default async function HomePage() {
  const groups = await listMyGroups();
  const last = groups?.[0] ?? null;
  const recent = (groups ?? []).slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 pb-24 pt-8">
      {/* Header minimal */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">Inicio</div>
          <h1 className="truncate text-2xl font-extrabold tracking-tight">GRUPLY</h1>
          <div className="mt-1 text-sm text-slate-600">Tu grupo, ordenado.</div>
        </div>

        <Link
          href="/app/groups"
          className="h-10 rounded-2xl bg-black px-4 sm:px-6 lg:px-8 text-sm font-semibold text-white inline-flex items-center"
        >
          Grupos
        </Link>
      </div>

      {/* Card principal: continuar */}
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
        {last ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">Continuar</div>
              <div className="mt-1 truncate text-lg font-extrabold">
                <span className="mr-2">{last.emoji ?? "👥"}</span>
                {last.name}
              </div>
              <div className="mt-1 text-xs text-slate-500 capitalize">
                {last.activity} · {last.currency}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/app/groups/${last.id}/calendar`}
                  className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold inline-flex items-center hover:bg-slate-50"
                >
                  Calendario
                </Link>
                <Link
                  href={`/app/groups/${last.id}/tournaments`}
                  className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold inline-flex items-center hover:bg-slate-50"
                >
                  Torneos
                </Link>
                <Link
                  href={`/app/groups/${last.id}/finance`}
                  className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold inline-flex items-center hover:bg-slate-50"
                >
                  Finanzas
                </Link>
              </div>
            </div>

            <Link
              href={`/app/groups/${last.id}`}
              className="h-10 shrink-0 rounded-2xl bg-black px-4 sm:px-6 lg:px-8 text-sm font-semibold text-white inline-flex items-center"
            >
              Entrar
            </Link>
          </div>
        ) : (
          <div>
            <div className="text-xs font-semibold text-slate-500">Empezar</div>
            <div className="mt-1 text-lg font-extrabold">Crea tu primer grupo</div>
            <div className="mt-2 text-sm text-slate-600">
              Entra, invita con link y organiza quedadas sin caos.
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                href="/app/groups"
                className="h-10 rounded-2xl bg-black px-4 sm:px-6 lg:px-8 text-sm font-semibold text-white inline-flex items-center"
              >
                Crear grupo
              </Link>
              <Link
                href="/app/groups"
                className="h-10 rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 lg:px-8 text-sm font-semibold inline-flex items-center hover:bg-slate-50"
              >
                Ver grupos
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Recientes: minimal */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Recientes</div>
          <div className="text-xs text-slate-500">{groups.length}</div>
        </div>

        <div className="mt-3 grid gap-2">
          {recent.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Todavia no hay grupos.
            </div>
          ) : (
            recent.map((g: any) => (
              <Link
                key={g.id}
                href={`/app/groups/${g.id}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-3 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">
                      <span className="mr-2">{g.emoji ?? "👥"}</span>
                      {g.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500 capitalize">
                      {g.activity} · {g.currency}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">Abrir</div>
                </div>
              </Link>
            ))
          )}

          {groups.length > recent.length && (
            <Link href="/app/groups" className="mt-2 text-sm font-semibold text-slate-700 underline">
              Ver todos
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
