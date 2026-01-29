export default function Sections() {
  const features = [
    { title: "Grupos", desc: "Crea grupos por deporte o juego, con roles y miembros." },
    { title: "Eventos", desc: "Quedadas con confirmacin, cupos y recordatorios." },
    { title: "Torneos", desc: "Ligas y eliminatorias con resultados y clasificacin." },
    { title: "Stats", desc: "Rendimiento, rachas, histrico y comparativas." },
    { title: "Finanzas", desc: "Gastos, botes, pagos y saldo por miembro." },
    { title: "Invitaciones", desc: "Link de invitacin y entrada en 1 toque." },
  ];

  return (
    <section id="features" className="border-t border-slate-100 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Funciones</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
            Todo lo importante, sin ruido
          </h2>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            Interfaz simple. Flujos claros. Pensado para hacerlo rpido desde el mvil.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-sm font-black">{f.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>

        <div id="how" className="mt-14 rounded-[2.5rem] border border-slate-200 bg-slate-50 p-8">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Cmo funciona</div>
          <h3 className="mt-2 text-2xl font-black tracking-tight">3 pasos</h3>

          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            <li className="rounded-3xl bg-white p-5">
              <div className="text-sm font-black">1) Crea un grupo</div>
              <p className="mt-2 text-sm text-slate-600">Pon nombre, foto y aade miembros.</p>
            </li>
            <li className="rounded-3xl bg-white p-5">
              <div className="text-sm font-black">2) Organiza</div>
              <p className="mt-2 text-sm text-slate-600">Crea eventos o torneos en segundos.</p>
            </li>
            <li className="rounded-3xl bg-white p-5">
              <div className="text-sm font-black">3) Juega</div>
              <p className="mt-2 text-sm text-slate-600">Resultados, tabla y stats siempre a mano.</p>
            </li>
          </ol>
        </div>

        <div id="pricing" className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Plan Base</div>
            <div className="mt-2 text-3xl font-black">Gratis</div>
            <p className="mt-2 text-sm text-slate-600">Perfecto para la mayora de grupos.</p>
            <ul className="mt-6 grid gap-2 text-sm text-slate-700">
              <li>?o. Grupos ilimitados</li>
              <li>?o. Eventos</li>
              <li>?o. Torneos bsicos</li>
              <li>?o. Finanzas simples</li>
            </ul>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-900 p-8 text-white">
            <div className="text-xs font-bold uppercase tracking-widest text-white/70">Premium</div>
            <div className="mt-2 text-3xl font-black">Prximamente</div>
            <p className="mt-2 text-sm text-white/70">
              Lo activaremos cuando el plan base sea impecable.
            </p>
            <ul className="mt-6 grid gap-2 text-sm text-white/90">
              <li>?o? Torneos PRO + modos avanzados</li>
              <li>?o? Estadsticas avanzadas</li>
              <li>?o? Roles/permiso admin</li>
              <li>?o? Exportaciones</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}