import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TournamentHubClient from "./TournamentHubClient";
import {
  getTournament,
  listParticipants,
  listParticipantEntities,
  listMatches,
  buildStandings,
  buildFormMap,
  type TournamentMatch,
} from "@/lib/tournaments/repo";
export default async function TournamentPage({
params,
  searchParams,
}: {
  params: Promise<{ groupId: string; tournamentId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { groupId, tournamentId } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const myId = me.user?.id ?? null;

async function getGroupOrNull(groupId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id,name,created_by,created_at")
    .eq("id", groupId)
    .maybeSingle();

  if (error) return null;
  return data ?? null;
}

  const group = await getGroupOrNull(groupId);
  if (!group) {
    return (
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-8">
        <Link className="text-sm font-semibold text-indigo-600 underline" href="/app/groups">
          {"\u2190"} Volver
        </Link>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Grupo no encontrado.</div>
      </main>
    );
  }

  let tournament: any = null;
  try {
    tournament = await getTournament(tournamentId);
  } catch {
    tournament = null;
  }

  if (!tournament || String(tournament.group_id) !== String(groupId)) {
    return (
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-8">
        <Link className="text-sm font-semibold text-indigo-600 underline" href={`/app/groups/${groupId}`}>
          {"\u2190"} Volver al grupo
        </Link>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Torneo no encontrado.</div>
      </main>
    );
  }

  const participants = await listParticipants(tournamentId);
  const entities = await listParticipantEntities(participants);


// Adaptamos el shape para el cliente (la UI usa starts_at/round/venue/winner)

const matchesDb: TournamentMatch[] = await listMatches(tournamentId);
const matchesUi = (matchesDb ?? []).map((m: any) => {
  const sa = m.score_a;
  const sb = m.score_b;
  const winner =
    sa == null || sb == null ? null : sa === sb ? null : sa > sb ? m.player_a : m.player_b;

  return {
    ...m,
    round: Number(m.matchday ?? 1),
    starts_at: m.scheduled_at ?? null,
    venue: m.location ?? null,
    winner,
  };
});

const standingsRaw = buildStandings(tournament, participants, matchesDb);
const standings = (standingsRaw ?? []).map((r: any) => ({
  id: r.id,
  label: entities[r.id]?.label ?? `Usuario ${String(r.id).slice(0, 6)}`,
  played: r.pj,
  won: r.g,
  drawn: r.e,
  lost: r.p,
  scored: r.pf,
  conceded: r.pc,
  diff: Number(r.pf) - Number(r.pc),
  points: r.pts,
}));

const formMap = buildFormMap(tournament, participants, matchesDb);

const ssrNowMs = Date.now();

  return (
    <TournamentHubClient
      groupId={groupId}
      groupName={group.name}
      groupEmoji={(group as any).emoji ?? null}
      tournament={tournament}
      tournamentId={tournamentId}
      myId={myId}
      participants={participants}
      entities={entities}
      matches={matchesUi}
      standings={standings}
      formMap={formMap}
      initialTab={sp.tab ?? "overview"}
      backHref={`/app/groups/${groupId}/tournaments`}
      ssrNowMs={ssrNowMs}
    />
  );
}






















