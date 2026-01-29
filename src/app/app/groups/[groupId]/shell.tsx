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

        <div className="flex items-center gap-1 overflow-x-auto px-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const href = t.href(groupId);
            const active =
              pathname === href ||
              (t.key !== "home" && pathname.startsWith(href + "/"));

            return (
              <Link
                key={t.key}
                href={href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap px-4 sm:px-6 lg:px-8 py-3 text-sm font-medium transition-colors border-b-2",
                  active
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
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