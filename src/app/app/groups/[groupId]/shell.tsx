"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Home, Calendar, Wallet, Trophy, BarChart3, MessageCircle, Share2, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "home", label: "Inicio", href: (g: string) => `/app/groups/${g}`, icon: Home },
  { key: "calendar", label: "Calendario", href: (g: string) => `/app/groups/${g}/calendar`, icon: Calendar },
  { key: "finance", label: "Finanzas", href: (g: string) => `/app/groups/${g}/finance`, icon: Wallet },
  { key: "tournaments", label: "Torneos", href: (g: string) => `/app/groups/${g}/tournaments`, icon: Trophy },
  { key: "ranking", label: "Ranking", href: (g: string) => `/app/groups/${g}/ranking`, icon: BarChart3 },
];

export default function GroupShell({
  children,
  groupId,
  groupName,
  activity,
  emoji,
  members,
}: {
  children: React.ReactNode;
  groupId: string;
  groupName: string;
  activity: string;
  emoji: string;
  members: number;
}) {
  const pathname = usePathname();
  const showFloatingChat = !pathname.endsWith("/chat");
  const router = useRouter();
  const gidShort = (groupId ?? "").slice(0, 8);

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white">
        <div className="px-4 sm:px-6 lg:px-8 pt-12 pb-3">
          <div className="flex items-center justify-between">
            <Link href="/app/groups" className="rounded-full p-2 hover:bg-slate-100" aria-label="Volver">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Link>

            <div className="flex items-center gap-2">
              <button className="rounded-full p-2 hover:bg-slate-100" aria-label="Compartir" onClick={() => router.push(`/app/groups?inviteGroup=${groupId}`)}>
                <Share2 className="h-5 w-5 text-slate-500" />
              </button>
              <Link href={`/app/groups/${groupId}/settings`} className="rounded-full p-2 hover:bg-slate-100" aria-label="Ajustes">
                <Settings className="h-5 w-5 text-slate-500" />
              </Link>
            </div>
          </div>

          <div className="mt-2">
            <h1 className="text-xl font-bold text-slate-900">
              {emoji ? <span className="mr-2">{emoji}</span> : null}
              {groupName} <span className="text-slate-300"> · </span>{" "}
              <span className="font-mono text-xs text-slate-400">{gidShort}</span>
            </h1>

            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <Users className="h-4 w-4" />
              <span>{members} miembros</span>
              <span className="text-slate-300"> · </span>
              <span className="capitalize">{activity}</span>
            </div>
          </div>
        </div>

        
        {/* Tabs (scroll horizontal en móvil) */}
        <div className="sticky top-[56px] z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0 no-scrollbar">
            <div className="flex min-w-max items-center gap-2 py-2">
              {tabs.map((t) => {
                const active = pathname?.endsWith(t.href);
                const tint =
                  t.label === "Inicio"
                    ? "data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700"
                    : t.label === "Calendario"
                      ? "data-[active=true]:bg-sky-50 data-[active=true]:text-sky-700"
                      : t.label === "Finanzas"
                        ? "data-[active=true]:bg-amber-50 data-[active=true]:text-amber-700"
                        : t.label === "Torneos"
                          ? "data-[active=true]:bg-violet-50 data-[active=true]:text-violet-700"
                          : "data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900";

                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    data-active={active}
                    className={[
                      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold",
                      "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900",
                      "transition",
                      "data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900",
                      tint,
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                      {t.icon}
                    </span>
                    <span className="whitespace-nowrap">{t.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-6 pb-24">{children}</main>
      {showFloatingChat ? (

      <button
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95"
        aria-label="Abrir chat"
        onClick={() => router.push(`/app/groups/${groupId}/chat`)}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </button>
      ) : null}
    </div>
  );
}