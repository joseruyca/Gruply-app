import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-3 md:items-start">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-black text-white">
              <span className="text-sm font-bold">G</span>
            </div>
            <div>
              <div className="text-sm font-bold">GRUPLY</div>
              <div className="text-xs text-slate-500">Organiza. Juega. Repite.</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <a href="#features" className="text-slate-600 hover:text-slate-900">Funciones</a>
            <a href="#how" className="text-slate-600 hover:text-slate-900">Cómo funciona</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900">Planes</a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900">FAQ</a>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/app"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-black"
            >
              Entrar a la app
            </Link>
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} GRUPLY. Hecho para grupos reales.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}