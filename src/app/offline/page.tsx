"use client";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh bg-white px-4 sm:px-6 lg:px-8 py-12">
      <div className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-2xl font-black">Estás sin conexión</div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Cuando recuperes internet, recarga la página.
        </p>
        <div className="mt-6 grid gap-2">
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white hover:bg-black"
          >
            Ir al inicio
          </a>
          <button
            onClick={() => location.reload()}
            className="h-11 rounded-2xl border border-slate-200 bg-white text-sm font-bold hover:bg-slate-50"
          >
            Reintentar
          </button>
        </div>
      </div>
    </main>
  );
}