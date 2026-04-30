"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";

type Opt = { id: string; label: string };

export default function AddMatchModal(props: {
  groupId: string;
  tournamentId: string;
  participants: Opt[];
  action: (formData: FormData) => void;
}) {
  const { groupId, tournamentId, participants, action } = props;

  const safe = Array.isArray(participants) ? participants : [];
  const [open, setOpen] = useState(false);

  const [a, setA] = useState(safe[0]?.id ?? "");
  const [b, setB] = useState(safe[1]?.id ?? "");

  // Si cambian participantes (o al abrir), intentamos preseleccionar 2 distintos
  useEffect(() => {
    if (!open) return;
    if (safe.length >= 2) {
      const first = safe[0]?.id ?? "";
      const second = safe.find((x) => x.id !== first)?.id ?? safe[1]?.id ?? "";
      setA(first);
      setB(second);
    } else if (safe.length === 1) {
      setA(safe[0].id);
      setB("");
    } else {
      setA("");
      setB("");
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function onOverlayMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setOpen(false);
  }

  const same = Boolean(a && b && a === b);

  const labelOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of safe) map.set(p.id, p.label);
    return (id: string) => map.get(id) ?? id;
  }, [safe]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 w-full rounded-2xl bg-black px-4 sm:px-6 lg:px-8 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        disabled={safe.length < 2}
        title={safe.length < 2 ? "Necesitas al menos 2 participantes" : ""}
      >
        + Partido
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-3 sm:p-6"
          onMouseDown={onOverlayMouseDown}
          aria-modal="true"
          role="dialog"
        >
          <div className="mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3">
              <div>
                <div className="text-sm font-semibold">Nuevo partido</div>
                <div className="mt-1 text-xs text-slate-500">
                  Emparejamiento manual (A vs B). Luego podrás poner el resultado.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <form action={action} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4">
              <input type="hidden" name="group_id" value={groupId} />
              <input type="hidden" name="tournament_id" value={tournamentId} />

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <div className="text-xs font-semibold text-slate-600">Jugador A</div>
                  <select
                    name="player_a"
                    value={a}
                    onChange={(e) => setA(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"
                  >
                    <option value="" disabled>
                      Selecciona jugador A… 
                    </option>
                    {safe.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <div className="text-xs font-semibold text-slate-600">Jugador B</div>
                  <select
                    name="player_b"
                    value={b}
                    onChange={(e) => setB(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"
                  >
                    <option value="" disabled>
                      Selecciona jugador B… 
                    </option>
                    {safe.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {same && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    Jugador A y B no pueden ser el mismo.
                  </div>
                )}

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="font-semibold text-slate-700">Resumen</div>
                  <div className="mt-1">
                    {a ? labelOf(a) : "—"} <span className="text-slate-400">vs</span> {b ? labelOf(b) : "—"}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 mt-4 border-t border-slate-100 bg-white pt-3">
                <button
                  disabled={!a || !b || same}
                  className="h-11 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  Crear partido
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
