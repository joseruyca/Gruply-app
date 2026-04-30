"use client";

import { useEffect, useState } from "react";

export default function DebugAuth() {
  const [href, setHref] = useState("");
  useEffect(() => setHref(window.location.href), []);
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl md:max-w-2xl lg:max-w-5xl flex-col px-5 py-10">
      <h1 className="text-2xl font-bold">Auth Debug</h1>
      <p className="mt-4 text-sm text-slate-600 break-all">{href}</p>
      <p className="mt-4 text-sm text-slate-500">
        Si el email no pasa por /auth/callback, lo veremos aquí.
      </p>
    </main>
  );
}