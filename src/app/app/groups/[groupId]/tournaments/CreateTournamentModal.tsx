"use client";

import * as React from "react";

type Props = {
  groupId: string;
  createAction: (formData: FormData) => Promise<void>;
};

const PRESETS = {
  futbol: { label: "Fútbol (3–1–0)", allowDraws: true, win: 3, draw: 1, loss: 0 },
  mus: { label: "Mus (1–0)", allowDraws: false, win: 1, draw: 0, loss: 0 },
  padel: { label: "Tenis/Pádel (1–0)", allowDraws: false, win: 1, draw: 0, loss: 0 },
  basket: { label: "Baloncesto (1–0)", allowDraws: false, win: 1, draw: 0, loss: 0 },
} as const;

type PresetKey = keyof typeof PRESETS;

export default function CreateTournamentModal({ groupId, createAction }: Props) {
  const [open, setOpen] = React.useState(false);
  const [preset, setPreset] = React.useState<PresetKey>("futbol");

  const presetValue = PRESETS[preset];

  // Cierra con ESC
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 sm:px-6 lg:px-8 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
      >
        + Crear torneo
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Nuevo torneo</div>
                <div className="text-xs text-slate-500">
                  Crea una liga/torneo en 30 segundos.
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-slate-100"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form action={createAction} className="mt-4 space-y-4">
              <input type="hidden" name="group_id" value={groupId} />

              <label className="block">
                <div className="text-xs font-medium text-slate-600">Nombre</div>
                <input
                  name="name"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Ej: Liga de los jueves"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-xs font-medium text-slate-600">Tipo</div>
                  <select
                    name="kind"
                    defaultValue="league"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="league">Liga (clasificación)</option>
                    <option value="cup">Copa (eliminatoria)</option>
                  </select>
                </label>

                <label className="block">
                  <div className="text-xs font-medium text-slate-600">Calendario</div>
                  <select
                    name="schedule_mode"
                    defaultValue="rr1"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="rr1">1 vuelta</option>
                    <option value="rr2">Ida / vuelta</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-600">Preset rápido</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPreset(k)}
                      className={
                        "rounded-xl border px-3 py-2 text-left text-sm font-semibold " +
                        (preset === k
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50")
                      }
                    >
                      <div className="text-sm">{PRESETS[k].label}</div>
                      <div className="mt-0.5 text-xs font-normal opacity-80">
                        Puntos: {PRESETS[k].win} / {PRESETS[k].draw} / {PRESETS[k].loss}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <div className="text-xs font-medium text-slate-600">Victoria</div>
                  <input
                    name="points_win"
                    inputMode="numeric"
                    defaultValue={presetValue.win}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-medium text-slate-600">Empate</div>
                  <input
                    name="points_draw"
                    inputMode="numeric"
                    defaultValue={presetValue.draw}
                    disabled={!presetValue.allowDraws}
                    className={
                      "mt-1 w-full rounded-xl border px-3 py-2 text-sm " +
                      (presetValue.allowDraws ? "border-slate-200" : "border-slate-100 bg-slate-50 text-slate-400")
                    }
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-medium text-slate-600">Derrota</div>
                  <input
                    name="points_loss"
                    inputMode="numeric"
                    defaultValue={presetValue.loss}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              {/* scoring_mode: valor que tu DB acepta. Usamos varios candidatos en backend, pero por defecto WDL */}
              <input type="hidden" name="scoring_mode" value="wdl" />

              <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <div>
                  <div className="text-sm font-semibold">Permitir empates</div>
                  <div className="text-xs text-slate-500">
                    Si lo desactivas, el empate pasa a 0 y se fuerza ganador.
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="allow_draws"
                  defaultChecked={presetValue.allowDraws}
                  className="h-5 w-5"
                />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-slate-600">Desempates</div>
                <select
                  name="tiebreak_preset"
                  defaultValue="h2h"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="h2h">Head-to-head → Diferencia → A favor</option>
                  <option value="classic">Diferencia → A favor</option>
                  <option value="for">A favor → Diferencia</option>
                </select>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-2 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 px-4 sm:px-6 lg:px-8 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Crear
                </button>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                Tip: si eliges <b>Manual</b>, podrás crear los partidos uno a uno.
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
