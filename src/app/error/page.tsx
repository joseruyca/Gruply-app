export default async function ErrorPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl md:max-w-2xl lg:max-w-5xl flex-col px-5 py-10">
      <h1 className="text-2xl font-bold">Ha ocurrido un error</h1>
      <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        {m ?? "Error desconocido"}
      </p>
      <a className="mt-6 text-sm font-semibold text-emerald-600 underline" href="/login">
        Volver a login
      </a>
    </main>
  );
}