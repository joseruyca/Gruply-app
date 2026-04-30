import Link from "next/link";
import InstallButton from "@/components/pwa/InstallButton";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
              <span className="text-sm font-black">G</span>
            </div>
            <div>
              <div className="text-sm font-black tracking-tight">GRUPLY</div>
              <div className="text-xs text-slate-500">Organiza. Juega. Repite.</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <InstallButton className="hidden h-10 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-black md:inline-flex" />
            <Link
              href="/app"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
            >
              Entrar
            </Link>
          </div>
        </header>

        <div className="relative mt-10 grid gap-10 pb-14 md:grid-cols-2 md:items-center md:pb-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Web-app móvil, rápida y limpia
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Tu grupo en orden.
              <span className="block text-slate-500">Eventos, torneos y más.</span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
              Crea grupos para cualquier deporte o juego. Apúntate a eventos, gestiona torneos y
              guarda todo en un sitio bonito y fácil.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-black"
              >
                Empezar ahora
              </Link>
              <a
                href="#how"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold hover:bg-slate-50"
              >
                Ver cómo funciona
              </a>
              <InstallButton className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold hover:bg-slate-50 md:hidden" />
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">✅ 0 fricción</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">📱 Pensado para móvil</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">🏆 Torneos y ligas</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">📈 Stats</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-white"></div>
            <div className="relative rounded-[2.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-black">Tu dashboard</div>
                <div className="text-xs text-slate-500">demo</div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-3xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold text-slate-500">Próximo evento</div>
                  <div className="mt-1 text-sm font-bold">Pádel miércoles</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>🕒 19:30</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                      Abierto
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-3xl bg-slate-50 p-4 text-center">
                    <div className="text-xs text-slate-500">Grupos</div>
                    <div className="mt-1 text-xl font-black">3</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-center">
                    <div className="text-xs text-slate-500">Eventos</div>
                    <div className="mt-1 text-xl font-black">8</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-center">
                    <div className="text-xs text-slate-500">Torneos</div>
                    <div className="mt-1 text-xl font-black">2</div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold text-slate-500">Torneo activo</div>
                  <div className="mt-1 text-sm font-bold">Liga Enero</div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[62%] bg-slate-900"></div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">62% completado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}