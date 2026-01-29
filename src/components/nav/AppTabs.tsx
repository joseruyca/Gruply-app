"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const items = [
  { href: "/app/groups", label: "Grupos", icon: Users },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/app/settings", label: "Ajustes", icon: Settings },
];

export default function AppTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/80 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex h-16 max-w-xl md:max-w-2xl lg:max-w-5xl items-center justify-around px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className="relative flex h-full w-20 flex-col items-center justify-center">
              <motion.div
                initial={false}
                animate={{ scale: active ? 1 : 0.96, y: active ? -2 : 0 }}
                className={cn("flex flex-col items-center", active ? "text-emerald-600" : "text-slate-400")}
              >
                <div className={cn("rounded-xl p-1.5", active && "bg-emerald-50")}>
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                </div>
                <span className={cn("mt-0.5 text-[10px] font-medium", active && "font-semibold")}>
                  {label}
                </span>
              </motion.div>

              {active && (
                <motion.div layoutId="navIndicator" className="absolute bottom-0 h-0.5 w-8 rounded-full bg-emerald-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}