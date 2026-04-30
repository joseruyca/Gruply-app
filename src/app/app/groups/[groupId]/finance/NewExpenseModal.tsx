"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";

type MemberOption = { id: string; label: string };

export default function NewExpenseModal(props: {
  action: (formData: FormData) => void;
  defaultPayerId: string;
  members?: MemberOption[];
}) {
  const { action, defaultPayerId, members } = props;

  const safeMembers = useMemo<MemberOption[]>(
    () => (Array.isArray(members) ? members : []),
    [members]
  );

  const [open, setOpen] = useState(false);

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
        className="h-11 w-full rounded-2xl bg-emerald-600 px-4 sm:px-6 lg:px-8 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-700 active:translate-y-px"
      >
        + Crear gasto
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-[6px] p-3 sm:p-6"
          onMouseDown={onOverlayMouseDown}
          aria-modal="true"
          role="dialog"
        >
          <div className="mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white to-slate-50 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-white/85 backdrop-blur px-4 py-3 sm:px-6 lg:px-8">
              <div className="text-sm font-extrabold text-slate-900">Nuevo gasto</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <form action={action} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid gap-3">
                <input
                  name="title"
                  placeholder="Título (ej: Cena)"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"
                />

                <input
                  name="amount"
                  placeholder="Cantidad (ej: 12,50)"
                  inputMode="decimal"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"
                />

                <select
                  name="payer_id"
                  defaultValue={defaultPayerId}
                  className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"
                >
                  <option value="" disabled>
                    ¿Quién pagó?
                  </option>
                  {safeMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <div className="grid gap-2">
                  <div className="text-xs font-semibold text-slate-600">
                    Participantes
                  </div>

                  <div className="grid gap-2 rounded-2xl border border-slate-100 p-3">
                    {safeMembers.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="participant_ids"
                          value={m.id}
                          defaultChecked
                          className="h-4 w-4"
                        />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 mt-4 border-t border-slate-100 bg-white pt-3">
                <button className="h-11 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600">
                  Crear gasto
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
