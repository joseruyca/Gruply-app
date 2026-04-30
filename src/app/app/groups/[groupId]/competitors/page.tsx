import Link from "next/link";
import { getGroupOrNull } from "@/lib/group/detail";
import { listGroupMembers } from "@/lib/members/repo";
import { listGroupCompetitors, listMyCompetitors } from "@/lib/competitors/repo";
import { createCompetitorAction, deleteCompetitorAction } from "./actions";

function pill(type: string) {
  return type === "pair"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-purple-100 text-purple-800";
}

export default async function CompetitorsPage({ params, searchParams }: { params: Promise<{ groupId: string }>; searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const { groupId } = await params;
  const sp = await searchParams;

  const group = await getGroupOrNull(groupId);
  if (!group) {
    return (
      <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-24 pt-8">
        <Link className="text-sm font-semibold text-emerald-600 underline" href="/app/groups">
          {"\u2190"} Volver
        </Link>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Grupo no encontrado.
        </div>
      </main>
    );
  }

  const members = await listGroupMembers(groupId);
  const competitors = await listGroupCompetitors(groupId);
  const mine = await listMyCompetitors(groupId);
  const mineSet = new Set(mine.map((c) => c.id));

  return (
    <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-28 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500">{group.name}</div>
          <h1 className="text-xl font-bold">Parejas y equipos</h1>
        </div>
        <Link className="text-sm text-slate-600 underline" href={`/app/groups/${groupId}`}>
          Volver
        </Link>
      </div>

      {(sp.saved || sp.deleted) && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {sp.saved && <div>Guardado.</div>}
          {sp.deleted && <div>Eliminado.</div>}
        </div>
      )}

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Crear</div>

        <div className="mt-3 grid gap-3">
          <details className="rounded-2xl border border-slate-200 p-3">
            <summary className="cursor-pointer select-none text-sm font-semibold">+ Crear pareja (dobles)</summary>

            <form className="mt-3 grid gap-3" action={createCompetitorAction.bind(null, groupId)}>
              <input type="hidden" name="type" value="pair" />
              <label className="grid gap-1 text-sm font-medium">
                Nombre de pareja
                <input name="name" className="h-11 rounded-2xl border border-slate-200 px-3" placeholder="Juan & Pedro" />
              </label>

              <label className="grid gap-1 text-sm font-medium">
                Miembro A
                <select name="member_a" className="h-11 rounded-2xl border border-slate-200 px-3" required>
                  <option value="">Selecciona...</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-medium">
                Miembro B
                <select name="member_b" className="h-11 rounded-2xl border border-slate-200 px-3" required>
                  <option value="">Selecciona...</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <button className="h-11 rounded-2xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">
                Crear pareja
              </button>

              <div className="text-xs text-slate-500">
                Útil para: pádel dobles, tenis dobles, mus, poker por parejas, etc.
              </div>
            </form>
          </details>

          <details className="rounded-2xl border border-slate-200 p-3">
            <summary className="cursor-pointer select-none text-sm font-semibold">+ Crear equipo</summary>

            <form className="mt-3 grid gap-3" action={createCompetitorAction.bind(null, groupId)}>
              <input type="hidden" name="type" value="team" />
              <label className="grid gap-1 text-sm font-medium">
                Nombre de equipo
                <input name="name" className="h-11 rounded-2xl border border-slate-200 px-3" placeholder="Los del Miércoles" />
              </label>

              <label className="grid gap-1 text-sm font-medium">
                Miembros (2-10)
                <select name="member_ids" multiple className="h-40 rounded-2xl border border-slate-200 px-3 py-2">
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <button className="h-11 rounded-2xl bg-purple-600 text-sm font-semibold text-white hover:bg-purple-700">
                Crear equipo
              </button>

              <div className="text-xs text-slate-500">
                Útil para: fútbol, baloncesto, ligas por equipos, etc. (mantén pulsado Ctrl/Cmd para seleccionar varios).
              </div>
            </form>
          </details>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Lista</div>
          <div className="text-xs text-slate-500">{competitors.length} total</div>
        </div>

        {competitors.length === 0 ? (
          <div className="mt-3 text-sm text-slate-500">Aún no hay parejas/equipos en este grupo.</div>
        ) : (
          <div className="mt-3 grid gap-3">
            {competitors.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold">{c.name}</div>
                      <span className={`shrink-0 rounded-xl px-2 py-0.5 text-[11px] font-bold ${pill(c.type)}`}>
                        {c.type === "pair" ? "PAREJA" : "EQUIPO"}
                      </span>
                      {mineSet.has(c.id) && (
                        <span className="shrink-0 rounded-xl bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          MÍO
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {c.members.map((m) => m.full_name).join(" · ") || "Sin miembros"}
                    </div>
                  </div>

                  <form action={deleteCompetitorAction.bind(null, groupId, c.id)}>
                    <button className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold hover:bg-slate-50">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
