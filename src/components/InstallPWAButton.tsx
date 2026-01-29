"use client";

import * as React from "react";
import { Download, Share2, PlusSquare, CheckCircle2, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const navAny: any = navigator as any;
  return Boolean(mql || navAny?.standalone);
}

export default function InstallPWAButton({
  className = "",
  variant = "primary",
  label = "Descargar app",
}: {
  className?: string;
  variant?: "primary" | "ghost";
  label?: string;
}) {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [openIosHelp, setOpenIosHelp] = React.useState(false);
  const ios = React.useMemo(() => isIos(), []);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setInstalled(isStandalone());
    setReady(true);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall as any);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall as any);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canInstall = !!deferred;

  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition shadow-sm";
  const primary = "bg-emerald-600 text-white hover:bg-emerald-700";
  const ghost = "bg-white/10 text-white hover:bg-white/15 border border-white/20";
  const primaryLight = "bg-emerald-600 text-white hover:bg-emerald-700";
  const ghostLight = "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200";

  // Elegimos estilos según el contexto (si lo usas sobre fondo oscuro o claro)
  const isGhost = variant === "ghost";
  const btnClass =
    base +
    " " +
    (isGhost ? ghostLight : primaryLight) +
    " " +
    className;

  async function onClick() {
    // Ya instalada
    if (installed) return;

    // iOS: no hay prompt -> mostramos ayuda
    if (ios) {
      setOpenIosHelp(true);
      return;
    }

    // Android/Chrome/Edge: prompt real si está disponible
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
        // si acepta, llegará appinstalled y lo marcará
        setDeferred(null);
      } catch {
        // ignore
      }
      return;
    }

    // No disponible: guía breve
    alert("Tu navegador no ofrece instalación ahora. Prueba Chrome/Edge y asegúrate de tener PWA (manifest + service worker) en HTTPS o localhost.");
  }

  if (!ready) return null;

  if (installed) {
    return (
      <button
        type="button"
        className={btnClass + " opacity-70 cursor-default"}
        disabled
        aria-label="App instalada"
      >
        <CheckCircle2 className="h-4 w-4" />
        App instalada
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={onClick} className={btnClass} aria-label={label}>
        <Download className="h-4 w-4" />
        {label}
      </button>

      {openIosHelp && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4">
          <div className="w-full max-w-xl md:max-w-2xl lg:max-w-5xl rounded-3xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-base font-extrabold text-slate-900">Instalar en iPhone (iOS)</div>
              <button
                className="rounded-2xl p-2 hover:bg-slate-50"
                onClick={() => setOpenIosHelp(false)}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 text-slate-700" />
              </button>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
              En iPhone/iPad no aparece el botón de instalar automático. Haz esto:
            </div>

            <ol className="mt-3 space-y-2 text-sm text-slate-800">
              <li className="flex gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-extrabold">1</span>
                <span>
                  Abre GRUPLY en <b>Safari</b>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-extrabold">2</span>
                <span>
                  Pulsa <b>Compartir</b> <Share2 className="inline h-4 w-4" />.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-extrabold">3</span>
                <span>
                  Elige <b>Añadir a pantalla de inicio</b> <PlusSquare className="inline h-4 w-4" />.
                </span>
              </li>
            </ol>

            <button
              className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700"
              onClick={() => setOpenIosHelp(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}