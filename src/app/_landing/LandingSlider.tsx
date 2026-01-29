"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Slide = {
  titleKicker: string;
  title: string;
  desc: string;
  caption: string;
  hint: string;
  imgSrc?: string;
};

export default function LandingSlider() {
  const slides: Slide[] = useMemo(
    () => [
      { titleKicker:"Arranque", title:"Tu grupo listo para moverse.", desc:"Invita al equipo, define roles y ten todo a mano desde el primer día.", caption:"Inicio · Grupos", hint:"Organiza tu grupo en minutos", imgSrc:"/landing/shot-1.png" },
      { titleKicker:"Eventos", title:"Asistencia clara en 1 toque.", desc:"Sí / quizá / no. Recordatorios y lista final sin “¿quién viene?” infinito.", caption:"Eventos · Asistencia", hint:"Quedadas y asistencia sin líos", imgSrc:"/landing/shot-2.png" },
      { titleKicker:"Ligas", title:"Resultados y ranking, sin Excel.", desc:"Apunta marcadores y consulta clasificación. Todo queda registrado.", caption:"Torneos · Ranking", hint:"Ligas y ranking en un clic", imgSrc:"/landing/shot-3.png" },
      { titleKicker:"Finanzas", title:"Cuentas claras para todo el equipo.", desc:"Cuotas, gastos y balance para que no haya malentendidos.", caption:"Finanzas · Gastos", hint:"Gastos y cuotas transparentes", imgSrc:"/landing/shot-4.png" },
    ],
    []
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState(0);

  function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }

  function scrollToIndex(nextIndex: number) {
    const el = viewportRef.current;
    if (!el) return;
    const i = clamp(nextIndex, 0, slides.length - 1);
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const w = el.clientWidth || 1;
        const next = Math.round(el.scrollLeft / w);
        setIdx(clamp(next, 0, slides.length - 1));
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [slides.length]);

  const progress = Math.round(((idx + 1) / slides.length) * 100);

  return (
    <section
      aria-label="Slider de capturas"
      style={{
        marginTop: 18,
        borderRadius: 24,
        background: "rgba(255,255,255,.72)",
        border: "1px solid rgba(15,23,32,.10)",
        boxShadow: "0 18px 60px rgba(15,23,32,.12)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          height: 10,
          background:
            "linear-gradient(90deg, rgba(57,215,164,.75), rgba(168,216,255,.55), rgba(246,229,141,.65), rgba(255,122,106,.60))",
          opacity: 0.75,
        }}
      />

      <button type="button" aria-label="Anterior" onClick={() => scrollToIndex(idx - 1)} disabled={idx === 0} style={navBtnStyle("left")}>‹</button>
      <button type="button" aria-label="Siguiente" onClick={() => scrollToIndex(idx + 1)} disabled={idx === slides.length - 1} style={navBtnStyle("right")}>›</button>

      <div
        aria-label="Paginación"
        style={{
          position: "absolute",
          left: "50%",
          bottom: 10,
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 999,
          border: "1px solid rgba(15,23,32,.10)",
          background: "rgba(255,255,255,.88)",
          boxShadow: "0 12px 26px rgba(15,23,32,.10)",
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir al slide ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: i === idx ? "rgba(255,122,106,1)" : "rgba(15,23,32,.20)",
                transform: i === idx ? "scale(1.35)" : "scale(1)",
                transition: "transform .2s ease, background .2s ease",
              }}
            />
          ))}
        </div>
        <div style={{ width: 110, height: 6, borderRadius: 999, background: "rgba(15,23,32,.10)", overflow: "hidden" }}>
          <i style={{ display: "block", height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, rgba(255,122,106,1), rgba(57,215,164,1))", borderRadius: 999, transition: "width .25s ease" }} />
        </div>
      </div>

      <div
        ref={viewportRef}
        style={{
          height: "clamp(560px, 78vh, 760px)",
          overflowX: "auto",
          overflowY: "hidden",
          display: "flex",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          overscrollBehaviorX: "contain",
          touchAction: "pan-x",
          background: "linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,.88))",
        }}
      >
        {slides.map((s, i) => (
          <article
            key={i}
            style={{
              minWidth: "100%",
              height: "100%",
              padding: 18,
              display: "grid",
              gridTemplateColumns: "0.95fr 1.05fr",
              gap: 16,
              alignItems: "center",
              scrollSnapAlign: "center",
            }}
          >
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 900, color: "rgba(15,23,32,.62)" }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: "rgba(57,215,164,1)", display: "inline-block", boxShadow: "0 0 0 8px rgba(57,215,164,.12)" }} />
                <span>{s.titleKicker}</span>
              </div>
              <h2 style={{ margin: "12px 0 0", fontSize: "clamp(26px, 3.6vw, 42px)", lineHeight: 1.07, letterSpacing: "-0.035em", fontWeight: 900 }}>
                {s.title}
              </h2>
              <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.6, fontWeight: 800, color: "rgba(15,23,32,.62)" }}>
                {s.desc}
              </p>
            </div>

            <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(15,23,32,.10)", background: "rgba(255,255,255,.90)", boxShadow: "0 10px 28px rgba(15,23,32,.10)", height: "clamp(320px, 46vh, 560px)", display: "grid", placeItems: "center" }}>
              <div aria-hidden="true" style={{ position: "absolute", inset: "-30%", background: "radial-gradient(closest-side at 30% 30%, rgba(57,215,164,.22), transparent 60%), radial-gradient(closest-side at 70% 55%, rgba(255,122,106,.18), transparent 62%), radial-gradient(closest-side at 55% 85%, rgba(246,229,141,.18), transparent 62%)", filter: "blur(22px)", opacity: 0.65, pointerEvents: "none" }} />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={s.caption}
                src={s.imgSrc}
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: 18, position: "relative", zIndex: 1 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />

              <div style={{ position: "absolute", left: 12, bottom: 12, padding: "8px 10px", borderRadius: 999, border: "1px solid rgba(15,23,32,.10)", background: "rgba(255,255,255,.85)", boxShadow: "0 10px 22px rgba(15,23,32,.08)", fontSize: 12, fontWeight: 900, color: "rgba(15,23,32,.72)", zIndex: 2 }}>
                {s.caption}
              </div>
            </div>
          </article>
        ))}
      </div>

      
    </section>
  );
}

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 50,
    height: 50,
    borderRadius: 999,
    border: "1px solid rgba(15,23,32,.12)",
    background: "rgba(255,255,255,.92)",
    boxShadow: "0 12px 26px rgba(15,23,32,.10)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    zIndex: 6,
    userSelect: "none",
    left: side === "left" ? 12 : undefined,
    right: side === "right" ? 12 : undefined,
    fontSize: 28,
    lineHeight: 1,
    paddingBottom: 4,
    opacity: 1,
  };
}

