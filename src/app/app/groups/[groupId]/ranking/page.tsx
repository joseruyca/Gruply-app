import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function shortId(id: string) {
  return id.length > 10 ? id.slice(0, 8) + "…" : id;
}

function pct(x: number) {
  if (!Number.isFinite(x)) return "0%";
  return `${Math.round(x * 100)}%`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function RankingPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me?.user?.id ?? null;

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role")
    .eq("group_id", groupId);

  const ids = Array.from(new Set((members ?? []).map((m: any) => m.user_id)));

  const { data: profs } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] as any };

  const nameById = new Map<string, string>();
  (profs ?? []).forEach((p: any) => nameById.set(p.id, String(p.full_name ?? "").trim()));

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, kind, status, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  const tIds = (tournaments ?? []).map((t: any) => t.id);

  const { data: matches } = tIds.length
    ? await supabase
        .from("tournament_matches")
        .select("tournament_id, player_a, player_b, score_a, score_b, status, played_at")
        .in("tournament_id", tIds)
        .eq("status", "played")
    : { data: [] as any };

  const stats: Record<string, any> = {};
  for (const id of ids) {
    stats[id] = {
      id,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      pf: 0,
      pc: 0,
      last: [] as { r: "G" | "E" | "P"; at?: string | null }[],
    };
  }

  for (const m of matches ?? []) {
    const a = (m as any).player_a;
    const b = (m as any).player_b;
    const sa = (m as any).score_a;
    const sb = (m as any).score_b;
    if (sa == null || sb == null) continue;

    if (!stats[a]) stats[a] = { id: a, pj: 0, g: 0, e: 0, p: 0, pf: 0, pc: 0, last: [] };
    if (!stats[b]) stats[b] = { id: b, pj: 0, g: 0, e: 0, p: 0, pf: 0, pc: 0, last: [] };

    const A = stats[a];
    const B = stats[b];
    A.pj += 1;
    B.pj += 1;
    A.pf += sa;
    A.pc += sb;
    B.pf += sb;
    B.pc += sa;

    if (sa > sb) {
      A.g += 1;
      B.p += 1;
      A.last.push({ r: "G", at: (m as any).played_at });
      B.last.push({ r: "P", at: (m as any).played_at });
    } else if (sa < sb) {
      B.g += 1;
      A.p += 1;
      B.last.push({ r: "G", at: (m as any).played_at });
      A.last.push({ r: "P", at: (m as any).played_at });
    } else {
      A.e += 1;
      B.e += 1;
      A.last.push({ r: "E", at: (m as any).played_at });
      B.last.push({ r: "E", at: (m as any).played_at });
    }
  }

  const rows = Object.values(stats).map((s: any) => {
    s.diff = s.pf - s.pc;
    s.winRate = s.pj ? s.g / s.pj : 0;
    s.last = (s.last ?? []).sort((x: any, y: any) => String(y.at ?? "").localeCompare(String(x.at ?? ""))).slice(0, 5);
    // streak
    const seq = s.last.map((x: any) => x.r);
    let streak = "";
    if (seq.length) {
      const first = seq[0];
      let n = 0;
      for (const r of seq) {
        if (r === first) n += 1;
        else break;
      }
      streak = `${first}${n}`;
    }
    s.streak = streak;
    return s;
  });

  rows.sort((a: any, b: any) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pj !== a.pj) return b.pj - a.pj;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.pf - a.pf;
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 pb-24 pt-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/app/groups/${groupId}`} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
            ← Volver al grupo
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Estadísticas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Resumen rápido de rendimiento (v1). En la siguiente iteración añadimos: MVP, rachas completas, head-to-head y filtros por torneo.
          </p>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Ranking por winrate</div>
          <div className="text-xs text-slate-500">{rows.length} miembros</div>
        </div>

        {rows.length === 0 ? (
          <div className="mt-3 text-sm text-slate-600">Aún no hay datos.</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Jugador</th>
                  <th className="py-2 pr-2">PJ</th>
                  <th className="py-2 pr-2">G</th>
                  <th className="py-2 pr-2">E</th>
                  <th className="py-2 pr-2">P</th>
                  <th className="py-2 pr-2">Diff</th>
                  <th className="py-2 pr-2">Win%</th>
                  <th className="py-2 pr-2">Últimos 5</th>
                  <th className="py-2 pr-2">Racha</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((r: any, i: number) => {
                  const name = nameById.get(r.id) || (uid && r.id === uid ? "Yo" : shortId(r.id));
                  return (
                    <tr key={r.id}>
                      <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                      <td className="py-2 pr-2 font-semibold">{name}</td>
                      <td className="py-2 pr-2">{r.pj}</td>
                      <td className="py-2 pr-2">{r.g}</td>
                      <td className="py-2 pr-2">{r.e}</td>
                      <td className="py-2 pr-2">{r.p}</td>
                      <td className="py-2 pr-2">{r.diff}</td>
                      <td className="py-2 pr-2 font-black">{pct(r.winRate)}</td>
                      <td className="py-2 pr-2">
                        <div className="flex gap-1">
                          {(r.last ?? []).map((x: any, j: number) => (
                            <span
                              key={j}
                              title={fmtDate(x.at)}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                x.r === "G"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : x.r === "P"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {x.r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-xs font-semibold text-slate-700">{r.streak || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
