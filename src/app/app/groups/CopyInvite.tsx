"use client";

import { useMemo, useState } from "react";

export default function CopyInvite({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (typeof window === "undefined") return `/join/${code}`;
    return `${window.location.origin}/join/${code}`;
  }, [code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  async function share() {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: "Invitación GRUPLY", text: "Únete a mi grupo en GRUPLY", url });
      } else {
        await copy();
      }
    } catch {}
  }

  return (
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        onClick={copy}
        className="h-10 flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50"
      >
        {copied ? "Copiado" : "Copiar link"}
      </button>
      <button
        type="button"
        onClick={share}
        className="h-10 flex-1 rounded-2xl bg-black text-sm font-semibold text-white hover:bg-slate-900"
      >
        Compartir
      </button>
    </div>
  );
}