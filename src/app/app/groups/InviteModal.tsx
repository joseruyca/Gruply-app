"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";

type Group = {
  id: string;
  name: string;
  emoji?: string | null;
  activity?: string | null;
};

function safeCopy(text: string) {
  // Clipboard API si está disponible
  if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text);

  // Fallback
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
  }
  return Promise.resolve();
}

export default function InviteModal(props: {
  groups: Group[];
  action: (formData: FormData) => void; // server action (formAction)
  defaultGroupId?: string | null;
  autoOpen?: boolean;

  // Si tras generar invite rediriges con ?invite=XXXX,
  // pásalo a este componente y te aparecerá el link para copiar/compartir.
  inviteCode?: string | null;
}) {
  const { groups, action, defaultGroupId, autoOpen, inviteCode } = props;

  const list = useMemo(() => (Array.isArray(groups) ? groups : []), [groups]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>("");

  const [origin, setOrigin] = useState<string>("");

  // origin (solo client)
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // default selection
  useEffect(() => {
    const first = defaultGroupId ?? list[0]?.id ?? "";
    setSelected(first);
  }, [defaultGroupId, list]);

  // auto open
  useEffect(() => {
    if (autoOpen && list.length > 0) setOpen(true);
  }, [autoOpen, list.length]);

  // si llega un inviteCode -> abre modal para copiar/compartir
  useEffect(() => {
    if (inviteCode) setOpen(true);
  }, [inviteCode]);

  // esc para cerrar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function overlayDown(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setOpen(false);
  }

  const selectedGroup = list.find((g) => g.id === selected) ?? null;

  const shareUrl = inviteCode && origin ? `${origin}/join/${inviteCode}` : "";

  async function onShare() {
    if (!shareUrl) return;

    // Web Share API si existe
    // (en desktop a veces no est, en mvil suele estar)
    const navAny = navigator as any;
    if (navAny?.share) {
      try {
        await navAny.share({
          title: "Invitación a GRUPLY",
          text: "Únete a mi grupo:",
          url: shareUrl,
        });
        return;
      } catch {
        // si cancelan, no hacemos nada
      }
    }

    await safeCopy(shareUrl);
    alert("Link copiado.");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-800 shadow-lg hover:bg-slate-50"
        aria-label="Invitar"
        title="Invitar"
      >
        <span className="text-lg font-bold">+</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-3 sm:p-6"
          onMouseDown={overlayDown}
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3">
              <div>
                <div className="text-sm font-semibold">Invitar</div>
                <div className="text-xs text-slate-500">
                  Genera un link y compártelo.
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
              {/* Si ya tenemos inviteCode, mostramos el link primero */}
              {inviteCode ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-900">
                    Link generado.
                  </div>

                  <div className="mt-2 break-all rounded-xl bg-white p-3 text-xs text-slate-700">
                    {shareUrl || "(cargando...)"}{" "}
                  </div>

                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!shareUrl) return;
                        await safeCopy(shareUrl);
                        alert("Link copiado.");
                      }}
                      className="h-11 rounded-2xl bg-black px-4 sm:px-6 lg:px-8 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      Copiar link
                    </button>

                    <button
                      type="button"
                      onClick={onShare}
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 lg:px-8 text-sm font-semibold hover:bg-slate-50"
                    >
                      Compartir
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-slate-600">
                    Consejo: abre siempre el último link generado.
                  </div>
                </div>
              ) : null}

              {/* Generar nuevo */}
              <form action={action} className="mt-4 grid gap-3">
                <div className="text-xs font-bold tracking-wide text-slate-500">
                  ELIGE GRUPO
                </div>

                <div className="grid gap-2">
                  {list.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      No tienes grupos todavía.
                    </div>
                  ) : (
                    list.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelected(g.id)}
                        className={
                          "flex items-center justify-between rounded-3xl border p-4 text-left " +
                          (g.id === selected
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-200 bg-white hover:bg-slate-50")
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-lg">
                            {g.emoji ?? "👥"}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {g.name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 capitalize">
                              {g.activity ?? "otro"}
                            </div>
                          </div>
                        </div>
                        <div
                          className={
                            g.id === selected
                              ? "text-emerald-700"
                              : "text-slate-400"
                          }
                        >
                          ✓
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <input type="hidden" name="groupId" value={selected} />

                <button
                  disabled={!selected}
                  className="h-11 rounded-2xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
                >
                  Generar link
                </button>

                {selectedGroup && (
                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Grupo seleccionado:{" "}
                    <span className="font-semibold">{selectedGroup.name}</span>
                  </div>
                )}
              </form>
            </div>

            <div className="border-t border-slate-100 px-4 sm:px-6 lg:px-8 py-3 text-xs text-slate-500">
              En local el link será: <span className="font-mono">http://localhost:3000/join/&lt;codigo&gt;</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
