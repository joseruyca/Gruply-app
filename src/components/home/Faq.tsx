const QA: Array<{ q: string; a: string }> = [
  { q: "¿Es una app o una web?", a: "Es una web-app móvil. En Android/Chrome podrás instalarla como app (PWA). En iOS se añade a pantalla de inicio." },
  { q: "¿Puedo tener varios grupos?", a: "Sí. Crea tantos como quieras: fútbol, pádel, mus, juegos de mesa..." },
  { q: "¿Necesito que todos se registren?", a: "Para torneos y datos persistentes sí, pero haremos invitación y entrada lo más fácil posible." },
  { q: "¿Qué incluirá Premium?", a: "Torneos avanzados, stats pro, roles, exportaciones y mejoras. Primero dejamos el plan base perfecto." },
];

export default function Faq() {
  return (
    <section id="faq" className="border-t border-slate-100 bg-slate-50/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">FAQ</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Preguntas frecuentes</h2>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            Si algo no encaja, lo ajustamos. GRUPLY se está puliendo para que sea perfecto.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-3">
          {QA.map((x) => (
            <details key={x.q} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-bold">
                <div className="flex items-center justify-between gap-3">
                  <span>{x.q}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition group-open:rotate-45">
                    +
                  </span>
                </div>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{x.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}