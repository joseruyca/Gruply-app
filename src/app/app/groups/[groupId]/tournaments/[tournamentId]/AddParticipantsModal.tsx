"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";

type Member = { id: string; label: string };

export default function AddParticipantsModal(props: {
  groupId: string;
  tournamentId: string;
  members: Member[];
  participantIds: string[];
  labels: Record<string, string>;
  addAction: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  const { groupId, tournamentId, members, participantIds, labels, addAction, removeAction } = props;

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const setIds = useMemo(() => new Set(participantIds ?? []), [participantIds]);

  const safeMembers = Array.isArray(members) ? members : [];

  const current = useMemo(() => {
    // En torneo: primero miembros conocidos, luego ids "sueltos"
    const inMembers = safeMembers.filter((m) => setIds.has(m.id));
    const extra = (participantIds ?? [])
      .filter((id) => !safeMembers.some((m) => m.id === id))
      .map((id) => ({ id, label: labels?.[id] ?? id }));
    return [...inMembers, ...extra];
  }, [safeMembers, participantIds, labels, setIds]);

  const available = useMemo(() => {
    const query = (q ?? "").trim().toLowerCase();
    return safeMembers
      .filter((m) => !setIds.has(m.id))
      .filter((m) => {
        if (!query) return true;
        return (m.label ?? "").toLowerCase().includes(query) || (m.id ?? "").toLowerCase().includes(query);
      });
  }, [safeMembers, q, setIds]);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 w-full rounded-2xl bg-black px-4 sm:px-6 lg:px-8 text-sm font-semibold text-white hover:bg-slate-900"
      >
        + Añadir participante
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
                <div className="text-sm font-semibold">Participantes</div>
                <div className="mt-1 text-xs text-slate-500">
                  Añade o quita miembros del grupo para este torneo.
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

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4">
              {/* Buscar */}
              <div className="mb-4">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar miembro…"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"
                />
              </div>

              {/* En el torneo */}
              <div className="text-xs font-semibold text-slate-600">En el torneo</div>
              <div className="mt-2 grid gap-2 rounded-2xl border border-slate-100 p-3">
                {current.length === 0 ? (
                  <div className="text-sm text-slate-500">Aún no hay participantes.</div>
                ) : (
                  current.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{m.label}</div>
                        <div className="truncate text-xs text-slate-500">{m.id}</div>
                      </div>

                      <form action={removeAction}>
                        <input type="hidden" name="group_id" value={groupId} />
                        <input type="hidden" name="tournament_id" value={tournamentId} />
                        <input type="hidden" name="user_id" value={m.id} />
                        <button className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold hover:bg-slate-50">
                          Quitar
                        </button>
                      </form>
                    </div>
                  ))
                )}
              </div>

              {/* Disponibles */}
              <div className="mt-5 text-xs font-semibold text-slate-600">Miembros del grupo</div>
              <div className="mt-2 grid gap-2 rounded-2xl border border-slate-100 p-3">
                {available.length === 0 ? (
                  <div className="text-sm text-slate-500">No hay miembros para añadir.</div>
                ) : (
                  available.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{m.label}</div>
                        <div className="truncate text-xs text-slate-500">{m.id}</div>
                      </div>

                      <form action={addAction}>
                        <input type="hidden" name="group_id" value={groupId} />
                        <input type="hidden" name="tournament_id" value={tournamentId} />
                        <input type="hidden" name="user_id" value={m.id} />
                        <button className="h-9 rounded-2xl bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-600">
                          Añadir
                        </button>
                      </form>
                    </div>
                  ))
                )}
              </div>

              <div className="h-4" />
            </div>

            <div className="border-t border-slate-100 bg-white px-4 sm:px-6 lg:px-8 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}