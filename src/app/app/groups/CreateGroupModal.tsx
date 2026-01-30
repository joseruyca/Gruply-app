"use client";

import * as React from "react";
import { createGroupAction } from "./actions";
import { Plus, X, Sparkles, ArrowRight, Users, Info } from "lucide-react";

const ACTIVITY = [
  { value: "mus", label: "Mus", emoji: "🂡" },
  { value: "padel", label: "Pádel", emoji: "🎾" },
  { value: "futbol", label: "Fútbol", emoji: "⚽" },
  { value: "baloncesto", label: "Baloncesto", emoji: "🏀" },
  { value: "running", label: "Running", emoji: "🏃" },
  { value: "senderismo", label: "Senderismo", emoji: "🥾" },
  { value: "gym", label: "Gym", emoji: "🏋️" },
  { value: "otro", label: "Otro", emoji: "✨" },
];

export default function CreateGroupModal() {
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const close = React.useCallback(() => setOpen(false), []);
  const openModal = React.useCallback(() => setOpen(true), []);

  // Bloquea el scroll de la página cuando el modal está abierto.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (open) requestAnimationFrame(() => panelRef.current?.focus());
  }, [open]);

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={openModal}
        className="grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:translate-y-px"
        aria-label="Crear grupo"
        title="Crear grupo"
      >
        <Plus className="h-6 w-6" />
      </button>

      {!open ? null : (
        <div
          className="fixed inset-0 z-50 grid place-items-end md:place-items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Crear grupo"
        >
          {/* Overlay */}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={close}
            className="absolute inset-0 bg-black/55 backdrop-blur-[6px] animate-g-fadeIn"
          />

          {/* Panel */}
          <div
            ref={panelRef}
            tabIndex={-1}
            className={[
              "relative w-full md:max-w-lg",
              "animate-g-sheetUp",
              "rounded-t-[28px] md:rounded-[28px]",
              "border border-white/15 bg-gradient-to-b from-white to-slate-50",
              "shadow-[0_24px_70px_rgba(0,0,0,0.35)]",
              "max-h-[92dvh] overflow-hidden",
              "flex flex-col",
            ].join(" ")}
          >
            {/* Top bar */}
            <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/85 backdrop-blur">
              <div className="flex items-center justify-between px-4 py-3 md:px-5">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-base font-extrabold text-slate-900">
                      Crear grupo
                    </div>
                    <div className="text-xs text-slate-500">Listo en 20 segundos</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-100"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content (SCROLL) */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-28 md:px-5">
              <form id="create-group-form" action={createGroupAction} className="space-y-4">
                {/* Nombre */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <div className="text-sm font-extrabold text-slate-900">
                      Nombre del grupo
                    </div>
                  </div>
                  <input
                    name="name"
                    placeholder="Ej: Mus del jueves"
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                    autoFocus
                    required
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    Un nombre claro ayuda a que la gente lo encuentre y se una rápido.
                  </div>
                </div>

                {/* Actividad + Emoji */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900">Actividad</div>
                    <div className="mt-1 text-xs text-slate-500">Elige un tipo y un icono.</div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <select
                      name="activity"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                      defaultValue="otro"
                    >
                      {ACTIVITY.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>

                    <select
                      name="emoji"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                      defaultValue="👥"
                    >
                      <option value="👥">👥 Grupo</option>
                      {ACTIVITY.map((a) => (
                        <option key={a.value} value={a.emoji}>
                          {a.emoji} {a.label}
                        </option>
                      ))}
                      <option value="✨">✨ Extra</option>
                    </select>
                  </div>
                </div>

                {/* Descripción */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-slate-500" />
                    <div className="text-sm font-extrabold text-slate-900">Descripción</div>
                    <span className="text-xs font-semibold text-slate-400">(opcional)</span>
                  </div>

                  <textarea
                    name="description"
                    placeholder="Ej: Quedadas semanales, torneo mensual, reglas del grupo…"
                    className="mt-3 min-h-[96px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <div className="mt-2 text-xs text-slate-500">Máximo 140 caracteres.</div>
                </div>

                {/* (No CTA aquí; el CTA va en footer sticky) */}
              </form>
            </div>

            {/* Footer (STICKY CTA) */}
            <div className="sticky bottom-0 z-10 border-t border-slate-200/70 bg-white/90 backdrop-blur px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] md:px-5">
              <button
                type="submit"
                form="create-group-form"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow hover:bg-emerald-700 active:translate-y-px"
              >
                Crear grupo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
