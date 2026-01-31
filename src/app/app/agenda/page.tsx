export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { listMyAgenda } from "./repo";

function pill(text: string, tone: "yes" | "maybe" | "no" | "none") {
  const base = "rounded-full px-3 py-1 text-xs font-bold border";
  const map: Record<string, string> = {
    yes: "bg-emerald-600 text-white border-emerald-600",
    maybe: "bg-amber-500 text-white border-amber-500",
    no: "bg-rose-600 text-white border-rose-600",
    none: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return <span className={`${base} ${map[tone]}`}>{text}</span>;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

export default async function AgendaPage() {
  const { items, rsvps } = await listMyAgenda();

  return (
    <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-28 pt-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold">Agenda</div>
          <div className="mt-1 text-xs text-slate-500">Tus próximos eventos (solo lectura).</div>
        </div>
        <Link href="/app" className="rounded-full border border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-2 text-sm font-bold hover:bg-slate-50">
          Volver
        </Link>
      </div>

      <section className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No tienes eventos próximos.
          </div>
        ) : (
          items.map((it) => {
            const { date, time } = fmtDateTime(it.starts_at);
            const r = rsvps?.[it.event_id];
            const tone = (r === "yes" ? "yes" : r === "maybe" ? "maybe" : r === "no" ? "no" : "none") as any;

            return (
              <div key={it.event_id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold truncate">
                      {(it.group_emoji ? it.group_emoji + " " : "")}{it.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {date} · {time}{it.place ? ` · ${it.place}` : ""}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 truncate">
                      Grupo: {it.group_name}
                    </div>
                  </div>
                  {r ? pill(r === "yes" ? "Voy" : r === "maybe" ? "Quizá" : "No voy", tone) : pill("Sin confirmar", "none")}
                </div>

                <div className="mt-3">
                  <Link
                    href={`/app/groups/${it.group_id}/calendar`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 sm:px-6 lg:px-8 py-2 text-sm font-bold text-white hover:bg-slate-900"
                  >
                    Ver en calendario
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}