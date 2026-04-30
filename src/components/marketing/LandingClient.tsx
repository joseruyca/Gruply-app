"use client";

import * as React from "react";
import Link from "next/link";

export default function LandingClient() {
  const layer1 = React.useRef<HTMLDivElement | null>(null);
  const layer2 = React.useRef<HTMLDivElement | null>(null);
  const layer3 = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY || 0;
        if (layer1.current) layer1.current.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
        if (layer2.current) layer2.current.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
        if (layer3.current) layer3.current.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // Placeholders (cámbialos luego por tus imágenes)
  const heroBg = "https://picsum.photos/seed/gruply-hero/1600/900";
  const screen1 = "https://picsum.photos/seed/gruply-screen1/900/1600";
  const screen2 = "https://picsum.photos/seed/gruply-screen2/900/1600";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500 font-extrabold text-slate-950">
              G
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold">GRUPLY</div>
              <div className="text-[11px] text-white/60">Grupos · Eventos · Torneos</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-950 hover:bg-white/90"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
        </div>

        {/* Parallax layers */}
        <div ref={layer1} className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div ref={layer2} className="pointer-events-none absolute top-20 left-[10%] h-[360px] w-[360px] rounded-full bg-indigo-500/15 blur-3xl" />
        <div ref={layer3} className="pointer-events-none absolute top-40 right-[8%] h-[420px] w-[420px] rounded-full bg-amber-400/10 blur-3xl" />

        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-14 md:grid-cols-2 md:pb-24 md:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Home lista para banner e imágenes
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">
              Organiza tu grupo sin líos:
              <span className="text-emerald-400"> eventos</span>, asistencia y torneos.
            </h1>

            <p className="mt-4 max-w-xl text-base text-white/70">
              GRUPLY es una web-app diseñada para móvil. Crea quedadas, confirma asistencia y mantén todo ordenado en segundos.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-emerald-400"
              >
                Abrir la app
              </Link>
              <a
                href="#features"
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
              >
                Ver features
              </a>
            </div>

            {/* Banner slot */}
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-extrabold">🖼️ Espacio para tu banner</div>
              <div className="mt-1 text-xs text-white/60">
                Aquí puedes poner una imagen principal, texto promocional o carrusel (lo pulimos cuando revisemos el ZIP).
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative">
            <div className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl">
              <div className="relative rounded-[2.2rem] border border-white/15 bg-white/5 p-3 shadow-2xl">
                <div className="absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 rounded-full bg-black/40" />
                <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950">
                  <img src={screen1} alt="Screenshot" className="h-[720px] w-full object-cover" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-white/70">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-extrabold text-white">Eventos</div>
                  <div className="mt-1">Crea en 10s</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-extrabold text-white">Calendario</div>
                  <div className="mt-1">Asistencia</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-extrabold text-white">Torneos</div>
                  <div className="mt-1">Ranking</div>
                </div>
              </div>

              <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-extrabold">Otro slot para imagen</div>
                <img src={screen2} alt="Preview" className="mt-3 h-40 w-full rounded-2xl object-cover opacity-90" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xl font-extrabold">Lo esencial (y ampliable)</div>
          <div className="mt-1 text-sm text-white/70">Dejamos la base limpia para que el proyecto no se rompa con cambios futuros.</div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <div className="text-sm font-extrabold">Calendario con RSVP</div>
              <div className="mt-2 text-sm text-white/70">Confirmar “Voy / Quizá / No voy” en el propio calendario.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <div className="text-sm font-extrabold">Chat rápido</div>
              <div className="mt-2 text-sm text-white/70">Fluido: autoscroll y limpieza del input al enviar.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <div className="text-sm font-extrabold">Torneos y finanzas</div>
              <div className="mt-2 text-sm text-white/70">Ranking, partidos y deudas, con permisos correctos (RLS).</div>
            </div>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs text-white/50">
          GRUPLY · Home provisional con placeholders (la refinamos al revisar el ZIP).
        </footer>
      </section>
    </div>
  );
}