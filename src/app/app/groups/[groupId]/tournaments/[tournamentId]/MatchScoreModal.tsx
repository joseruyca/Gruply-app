"use client";

import * as React from "react";
import { X } from "lucide-react";

export type MatchSchema = "numeric" | "winner" | "sets";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function MatchScoreModal({
  open,
  onClose,
  tournamentId,
  matchId,
  schema,
  action,
  defaultScoreA,
  defaultScoreB,
  defaultSets,
  returnTab = "matches",
}: {
  open: boolean;
  onClose: () => void;
  tournamentId: string;
  matchId: string;
  schema: MatchSchema;
  action: (formData: FormData) => Promise<void>;
  defaultScoreA?: number | null;
  defaultScoreB?: number | null;
  defaultSets?: any[] | null;
  returnTab?: string;
}) {
  const [scoreA, setScoreA] = React.useState<string>(defaultScoreA == null ? "" : String(defaultScoreA));
  const [scoreB, setScoreB] = React.useState<string>(defaultScoreB == null ? "" : String(defaultScoreB));

  const [sets, setSets] = React.useState<Array<{ a: string; b: string }>>(() => {
    const s = Array.isArray(defaultSets) ? defaultSets : [];
    if (s.length) return s.map((x: any) => ({ a: String(x?.a ?? ""), b: String(x?.b ?? "") }));
    return [{ a: "", b: "" }];
  });

  React.useEffect(() => {
    setScoreA(defaultScoreA == null ? "" : String(defaultScoreA));
    setScoreB(defaultScoreB == null ? "" : String(defaultScoreB));
    const s = Array.isArray(defaultSets) ? defaultSets : [];
    setSets(s.length ? s.map((x: any) => ({ a: String(x?.a ?? ""), b: String(x?.b ?? "") })) : [{ a: "", b: "" }]);
  }, [defaultScoreA, defaultScoreB, defaultSets, open]);

  if (!open) return null;

  const pill = "rounded-2xl border px-3 py-2 text-sm font-bold";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-400" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-extrabold">Resultado</div>
              <div className="mt-1 text-xs text-slate-500">Actualiza el marcador. Se recalcula la clasificación.</div>
            </div>
            <button onClick={onClose} className="rounded-2xl p-2 hover:bg-slate-50" aria-label="Cerrar">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form action={action} onSubmit={onClose} className="mt-4 space-y-3">
            <input type="hidden" name="matchId" value={matchId} />
            <input type="hidden" name="schema" value={schema} />
            <input type="hidden" name="returnTab" value={returnTab} />

            {schema === "numeric" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">A</label>
                  <input
                    type="number"
                    name="scoreA"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">B</label>
                  <input
                    type="number"
                    name="scoreB"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            {schema === "winner" && (
              <div className="grid grid-cols-2 gap-2">
                <button type="submit" name="winner" value="a" className={cn(pill, "bg-indigo-600 text-white border-indigo-600")}>Ganó A</button>
                <button type="submit" name="winner" value="b" className={cn(pill, "bg-cyan-500 text-white border-cyan-500")}>Ganó B</button>
                <button type="submit" name="winner" value="none" className={cn(pill, "bg-white text-slate-700 border-slate-200 col-span-2")}>Quitar ganador</button>
              </div>
            )}

            {schema === "sets" && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600">Sets</div>
                {sets.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={s.a}
                      onChange={(e) => setSets((p) => p.map((x, i) => (i === idx ? { ...x, a: e.target.value } : x)))}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="A"
                    />
                    <input
                      type="number"
                      value={s.b}
                      onChange={(e) => setSets((p) => p.map((x, i) => (i === idx ? { ...x, b: e.target.value } : x)))}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="B"
                    />
                    <input type="hidden" name={`sets_${idx}_a`} value={s.a} />
                    <input type="hidden" name={`sets_${idx}_b`} value={s.b} />
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSets((p) => [...p, { a: "", b: "" }])}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                  >
                    + Añadir set
                  </button>
                  <button
                    type="button"
                    onClick={() => setSets((p) => (p.length > 1 ? p.slice(0, -1) : p))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                  >
                    − Quitar
                  </button>
                </div>

                <input type="hidden" name="setsCount" value={String(sets.length)} />
              </div>
            )}

            {schema !== "winner" && (
              <button
                type="submit"
                className="mt-2 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow hover:bg-indigo-700"
              >
                Guardar
              </button>
            )}
          </form>

          <div className="mt-3 text-xs text-slate-500">Torneo: <span className="font-semibold">{tournamentId}</span></div>
        </div>
      </div>
    </div>
  );
}
