import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { listTournaments } from "@/lib/tournaments/repo";
import CreateTournamentModal from "./CreateTournamentModal";
import { createTournamentAction } from "./actions";

function badge(status: string) {
  if (status === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "finished") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default async function TournamentsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id ?? null;

  // Permiso: admin o miembro con can_manage_tournaments.
  let canManageTournaments = false;
  if (uid) {
    const res1 = await supabase
      .from("group_members")
      .select("role, can_manage_tournaments")
      .eq("group_id", groupId)
      .eq("user_id", uid)
      .maybeSingle();

    if (res1.error) {
      const msg = String(res1.error.message || "").toLowerCase();
      if (msg.includes("can_manage_tournaments") && msg.includes("does not exist")) {
        const res2 = await supabase
          .from("group_members")
          .select("role")
          .eq("group_id", groupId)
          .eq("user_id", uid)
          .maybeSingle();
        const role = (res2.data as any)?.role ?? "member";
        canManageTournaments = role === "admin";
      }
    } else {
      const role = (res1.data as any)?.role ?? "member";
      const can = Boolean((res1.data as any)?.can_manage_tournaments);
      canManageTournaments = role === "admin" || can;
    }
  }
  const tournaments = await listTournaments(groupId);

  return (
    <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-24 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Torneos & ligas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Crea una liga, genera partidos, mete resultados y mira la clasificación.
          </p>
        </div>
        {canManageTournaments ? (
          <CreateTournamentModal groupId={groupId} createAction={createTournamentAction.bind(null, groupId)} />
        ) : (
          <div className="text-right text-xs font-semibold text-slate-400">Solo admins / gestores</div>
        )}
      </div>

      <section className="mt-6 space-y-3">
        {tournaments.map((t) => (
          <Link
            key={t.id}
            href={`/app/groups/${groupId}/tournaments/${t.id}`}
            className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">{t.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {t.kind === "league" ? "Liga" : "Copa"} · Creado {String(t.created_at ?? "").slice(0, 10) || ""}
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${badge(t.status)}`}>
                {t.status === "draft" ? "Borrador" : t.status === "active" ? "Activo" : "Finalizado"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-50 p-2">
                <div className="text-[11px] font-medium text-slate-500">Puntos</div>
                <div className="mt-0.5 text-sm font-semibold">
                  {t.points_win ?? 3}/{t.allow_draws ? t.points_draw ?? 1 : 0}/{t.points_loss ?? 0}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2">
                <div className="text-[11px] font-medium text-slate-500">Empates</div>
                <div className="mt-0.5 text-sm font-semibold">{t.allow_draws ? "Sí" : "No"}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2">
                <div className="text-[11px] font-medium text-slate-500">Desempate</div>
                <div className="mt-0.5 truncate text-sm font-semibold">
                  {(t.tiebreak_order ?? []).slice(0, 2).join(" · ") || "-"}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {tournaments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <div className="text-sm font-semibold">Aún no hay torneos</div>
            <div className="mt-1 text-sm text-slate-500">
              Crea uno para empezar a organizar partidos y clasificación.
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Ideas rápidas</div>
        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          <li>• Mus: calendario manual o 1 vuelta, sin empates.</li>
          <li>• Fútbol/póker: 1 vuelta o ida/vuelta, con empates si aplica.</li>
          <li>• Tenis/pádel: sin empates, 1 punto por victoria.</li>
        </ul>
      </section>
    </main>
  );
}
