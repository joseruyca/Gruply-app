"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function useAnyModalOpen() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      const any = !!document.querySelector('[aria-modal="true"]');
      setOpen(any);
    };

    check();

    // Observa cambios del DOM (cuando montas/desmontas modales)
    const obs = new MutationObserver(() => check());
    obs.observe(document.body, { childList: true, subtree: true });

    return () => obs.disconnect();
  }, []);

  return open;
}

export default function AppTabs() {
  const pathname = usePathname();
  const modalOpen = useAnyModalOpen();

  const isActive = (href: string) =>
    pathname === href || (href !== "/app" && pathname?.startsWith(href));

  return (
    <nav
      className={[
        "fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/80 backdrop-blur-xl safe-bottom",
        // CLAVE: si hay modal abierto, no bloquea taps
        modalOpen ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100",
        "transition-opacity duration-150",
      ].join(" ")}
      aria-label="Navegación inferior"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-around px-3 py-2">
        <Link
          href="/app/groups"
          className={[
            "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold",
            isActive("/app/groups") ? "text-emerald-700" : "text-slate-500",
          ].join(" ")}
        >
          <span>Grupos</span>
        </Link>

        <Link
          href="/app/agenda"
          className={[
            "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold",
            isActive("/app/agenda") ? "text-emerald-700" : "text-slate-500",
          ].join(" ")}
        >
          <span>Agenda</span>
        </Link>

        <Link
          href="/app/settings"
          className={[
            "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold",
            isActive("/app/settings") ? "text-emerald-700" : "text-slate-500",
          ].join(" ")}
        >
          <span>Ajustes</span>
        </Link>
      </div>
    </nav>
  );
}
