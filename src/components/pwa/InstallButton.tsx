"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

type BIPEvent = Event & {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallButton({
  className,
  label = "Descargar",
}: {
  className?: string;
  label?: string;
}) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  const canInstall = useMemo(() => !!deferred && !installed, [deferred, installed]);

  useEffect(() => {
    // standalone detection (best effort)
    // @ts-ignore not always typed
    if (window.matchMedia?.("(display-mode: standalone)")?.matches) setInstalled(true);

    const onAppInstalled = () => setInstalled(true);
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };

    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  async function handleClick() {
    // If the browser can't prompt (e.g. iOS Safari), scroll to instructions section.
    if (!deferred?.prompt) {
      document.getElementById("instalar")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    await deferred.prompt();
    try {
      const choice = await deferred.userChoice;
      if (choice?.outcome === "accepted") setInstalled(true);
    } finally {
      setDeferred(null);
    }
  }

  const base =
    className ??
    "inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-black active:scale-[0.98]";

  if (installed) {
    return (
      <button type="button" className={base + " opacity-70 cursor-default"} disabled>
        <Download className="h-4 w-4" />
        Instalado
      </button>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={base}>
      <Download className="h-4 w-4" />
      {canInstall ? `${label} app` : label}
    </button>
  );
}

