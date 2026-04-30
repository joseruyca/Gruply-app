"use client";


import type { MatchSchema } from "./MatchScoreModal";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Trophy,
  Swords,
  Users,
  Settings,
  CalendarDays,
  Sparkles,
  Wand2,
  Plus,
  Play,
  Flag,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";

import {
  joinTournamentAction,
  leaveTournamentAction,
  generateScheduleAction,
  startTournamentAction,
  finishTournamentAction,
  createManualMatchAction,
  setMatchScoreAction,
} from "../actions";
import MatchScoreModal from "./MatchScoreModal";

type Entity = { id: string; kind: "user" | "competitor"; label: string };

type MatchRow = {
  id: string;
  tournament_id: string;
  round: number;
  matchday: number;
  starts_at: string | null;
  status: string;
  player_a: string;
  player_b: string;
  winner: string | null;
  score_a: number | null;
  score_b: number | null;
  score_payload: any;
  played_at: string | null;
};

type StandingRow = {
  id: string;
  label: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  scored: number;
  conceded: number;
  diff: number;
};

type TabKey = "overview" | "matches" | "standings" | "players" | "settings";

type Tone = "slate" | "indigo" | "emerald" | "amber" | "sky" | "violet" | "rose";

function toneClasses(tone?: Tone) {
  const t = tone ?? "slate";
  if (t === "indigo")
    return {
      wrap: "border-indigo-200/70 bg-indigo-50/70 border-l-4 border-l-indigo-400",
      dot: "bg-indigo-600",
      soft: "bg-indigo-50",
    };
  if (t === "emerald")
    return {
      wrap: "border-emerald-200/70 bg-emerald-50/70 border-l-4 border-l-emerald-400",
      dot: "bg-emerald-600",
      soft: "bg-emerald-50",
    };
  if (t === "amber")
    return {
      wrap: "border-amber-200/70 bg-amber-50/70 border-l-4 border-l-amber-400",
      dot: "bg-amber-500",
      soft: "bg-amber-50",
    };
  if (t === "sky")
    return {
      wrap: "border-sky-200/70 bg-sky-50/70 border-l-4 border-l-sky-400",
      dot: "bg-sky-600",
      soft: "bg-sky-50",
    };
  if (t === "violet")
    return {
      wrap: "border-violet-200/70 bg-violet-50/70 border-l-4 border-l-violet-400",
      dot: "bg-violet-600",
      soft: "bg-violet-50",
    };
  if (t === "rose")
    return {
      wrap: "border-rose-200/70 bg-rose-50/70 border-l-4 border-l-rose-400",
      dot: "bg-rose-600",
      soft: "bg-rose-50",
    };
  return { wrap: "border-slate-200 bg-white border-l-4 border-l-slate-300", dot: "bg-slate-900", soft: "bg-slate-50" };
}


function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function safeTab(x: string | null): TabKey {
  const v = (x ?? "").toLowerCase().trim();
  if (v === "overview" || v === "matches" || v === "standings" || v === "players" || v === "settings") return v;
  return "overview";
}

function isPlayed(m: MatchRow) {
  return (m.status ?? "").toLowerCase() === "played";
}

const fmt = {
  day: new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Madrid",
  }),
  when: new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }),
};

function fmtWhen(iso: string | null) {
  if (!iso) return "";
  return fmt.when.format(new Date(iso));
}

function scoreLabel(schema: string, m: MatchRow, entities: Record<string, Entity>) {
  const s = (schema ?? "numeric").toLowerCase();
  if (!isPlayed(m)) return "—";

  if (s === "winner") {
    if (!m.winner) return "—";
    const w = entities[m.winner]?.label ?? "";
    return w ? `🏆 ${w}` : "🏆";
  }

  if (s === "sets") {
    const p = (m.score_payload ?? {}) as any;
    const sets = Array.isArray(p?.sets) ? p.sets : [];
    if (!sets.length) return "—";
    return sets
      .slice(0, 4)
      .map((x: any) => `${x.a ?? "-"}-${x.b ?? "-"}`)
      .join(" ");
  }

  const sa = m.score_a ?? 0;
  const sb = m.score_b ?? 0;
  return `${sa} - ${sb}`;
}

function badgeForTournamentStatus(status: string) {
  const s = (status ?? "draft").toLowerCase();
  if (s === "draft") return "bg-amber-100 text-amber-900";
  if (s === "running") return "bg-emerald-100 text-emerald-900";
  if (s === "finished") return "bg-slate-200 text-slate-900";
  return "bg-slate-200 text-slate-900";
}

function badgeForMatchStatus(status: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "played") return "bg-emerald-100 text-emerald-900";
  if (s === "scheduled") return "bg-indigo-100 text-indigo-900";
  return "bg-slate-200 text-slate-900";
}

function labelScheduleMode(x: string) {
  const v = (x ?? "").toLowerCase();
  if (v === "rr1") return "Liga · 1 vuelta";
  if (v === "rr2") return "Liga · ida/vuelta";
  if (v === "manual") return "Manual";
  return v || "—";
}

function labelKind(x: string) {
  const v = (x ?? "").toLowerCase();
  if (v === "league") return "Liga";
  if (v === "cup") return "Copa";
  return v || "—";
}

function nextUpcoming(matches: MatchRow[], nowMs: number) {
  const upcoming = matches
    .filter((m) => (m.status ?? "").toLowerCase() !== "played")
    .filter((m) => !!m.starts_at)
    .sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));

  const next =
    upcoming.find((m) => (m.starts_at ? new Date(m.starts_at).getTime() >= nowMs : false)) ?? upcoming[0];

  return next ?? null;
}

function groupByMatchday(matches: MatchRow[]) {
  const map = new Map<number, MatchRow[]>();
  for (const m of matches) {
    const k = Number(m.matchday ?? 1);
    const arr = map.get(k) ?? [];
    arr.push(m);
    map.set(k, arr);
  }
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => String(a.starts_at ?? "").localeCompare(String(b.starts_at ?? "")));
    map.set(k, arr);
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}


function SectionCard({
  title,
  subtitle,
  right,
  children,
  tone,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  tone?: Tone;
}) {
  const t = toneClasses(tone);

  return (
    <section className={cn("rounded-3xl border p-4 shadow-sm", t.wrap)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", t.dot)} />
            <div className="text-base font-extrabold text-slate-900">{title}</div>
          </div>
          {subtitle ? <div className="mt-1 text-xs text-slate-600">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}



function AccordionCard({
  title,
  subtitle,
  right,
  defaultOpen,
  children,
  tone,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  tone?: Tone;
}) {
  const t = toneClasses(tone);

  return (
    <details
      open={defaultOpen}
      className={cn("group rounded-3xl border shadow-sm", t.wrap)}
    >

      <summary className="list-none cursor-pointer select-none p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", t.dot)} />
              <div className="text-base font-extrabold text-slate-900">{title}</div>
            </div>
            {subtitle ? <div className="mt-1 text-xs text-slate-600">{subtitle}</div> : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {right ? <div className="shrink-0">{right}</div> : null}
            <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
          </div>
        </div>
      </summary>

      <div className="px-4 pb-4 pt-0">{children}</div>
    </details>
  );
}


function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", className)}>{children}</span>;
}

function PrimaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-sm",
        "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200",
        props.disabled ? "opacity-50 hover:bg-indigo-600" : "",
        className
      )}
    />
  );
}

function SecondaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold",
        "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50",
        className
      )}
    />
  );
}

function GhostButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold",
        "text-slate-900 hover:bg-slate-100",
        className
      )}
    />
  );
}

function StickyTabs({ tab, onTab }: { tab: TabKey; onTab: (t: TabKey) => void }) {
  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: "overview", label: "Resumen", icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: "matches", label: "Partidos", icon: <Swords className="h-4 w-4" /> },
    { key: "standings", label: "Tabla", icon: <Trophy className="h-4 w-4" /> },
    { key: "players", label: "Gente", icon: <Users className="h-4 w-4" /> },
    { key: "settings", label: "Ajustes", icon: <Settings className="h-4 w-4" /> },
  ];


const activeTabClasses: Record<TabKey, string> = {
  overview: "bg-gradient-to-r from-indigo-700 to-indigo-600",
  matches: "bg-gradient-to-r from-violet-700 to-indigo-600",
  standings: "bg-gradient-to-r from-emerald-700 to-emerald-600",
  players: "bg-gradient-to-r from-sky-700 to-sky-600",
  settings: "bg-gradient-to-r from-slate-900 to-slate-700",
};

  return (
    <div className="sticky top-0 z-20 -mx-4 mt-3 border-b border-slate-200 bg-slate-50/90 px-4 pb-3 pt-3 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ring-1 transition",
                active
                  ? `text-white ring-transparent shadow-sm ${activeTabClasses[t.key]}`
                  : "bg-white text-slate-900 ring-slate-200 hover:bg-slate-100"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActionSheet({
  open,
  onClose,
  isCreator,
  status,
  hasParticipants,
  hasMatches,
  tab,
  onOpenManual,
  generateAction,
  startAction,
  finishAction,
}: {
  open: boolean;
  onClose: () => void;
  isCreator: boolean;
  status: string;
  hasParticipants: boolean;
  hasMatches: boolean;
  tab: string;
  onOpenManual: () => void;
  generateAction: any;
  startAction: any;
  finishAction: any;
}) {
  if (!open) return null;

  const s = (status ?? "draft").toLowerCase();

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold">Acciones</div>
            <div className="mt-1 text-xs text-slate-600">Todo lo importante, sin mezclarlo con el resto de la pantalla.</div>
          </div>
          <GhostButton onClick={onClose}>Cerrar</GhostButton>
        </div>

        {!isCreator ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            Solo el creador puede generar partidos, iniciar o finalizar el torneo.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <form action={generateAction}>
              <input type="hidden" name="returnTab" value={tab} />
              <PrimaryButton className="w-full" disabled={!hasParticipants}>
                <Wand2 className="h-4 w-4" /> Generar calendario
              </PrimaryButton>
              {!hasParticipants ? (
                <div className="mt-1 text-xs text-rose-700">Necesitas al menos 2 participantes.</div>
              ) : null}
            </form>

            <SecondaryButton className="w-full" onClick={() => (onClose(), onOpenManual())}>
              <Plus className="h-4 w-4" /> Añadir partido manual
            </SecondaryButton>

            {s === "draft" ? (
              <form action={startAction}>
                <input type="hidden" name="returnTab" value={tab} />
                <SecondaryButton className="w-full" disabled={!hasMatches}>
                  <Play className="h-4 w-4" /> Iniciar torneo
                </SecondaryButton>
                {!hasMatches ? (
                  <div className="mt-1 text-xs text-rose-700">Primero crea partidos (generar o manual).</div>
                ) : null}
              </form>
            ) : null}

            {s === "running" ? (
              <form action={finishAction}>
                <input type="hidden" name="returnTab" value={tab} />
                <SecondaryButton className="w-full">
                  <Flag className="h-4 w-4" /> Finalizar torneo
                </SecondaryButton>
              </form>
            ) : null}

            {s === "finished" ? (
              <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">El torneo está finalizado.</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TournamentHubClient({
  groupId,
  groupName,
  groupEmoji,
  tournament,
  tournamentId,
  myId,
  participants,
  entities,
  matches,
  standings,
  formMap,
  initialTab,
  backHref,
  ssrNowMs,
}: {
  groupId: string;
  groupName: string;
  groupEmoji: string | null;
  tournament: any;
  tournamentId: string;
  myId: string | null;
  participants: string[];
  entities: Record<string, Entity>;
  matches: MatchRow[];
  standings: StandingRow[];
  formMap: Record<string, string[]>;
  initialTab: string;
  backHref: string;
  ssrNowMs: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const tabFromUrl = safeTab(sp.get("tab"));
  const [tab, setTab] = React.useState<TabKey>(() => safeTab(initialTab));

  React.useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  const setTabAndUrl = React.useCallback(
    (t: TabKey) => {
      setTab(t);
      const qs = new URLSearchParams(sp.toString());
      qs.set("tab", t);
      router.replace(`?${qs.toString()}`);
    },
    [router, sp]
  );

  const [nowMs, setNowMs] = React.useState<number>(() => ssrNowMs);
  React.useEffect(() => {
    // Actualiza tras hidratar para cálculos “vivos” (sin romper SSR)
    setNowMs(Date.now());
  }, []);

  const isCreator = myId && String(tournament.created_by ?? "") === String(myId);
  const amParticipant = myId ? participants.includes(myId) : false;

  const showJoinCta = !!myId && !amParticipant;
  const showLeaveCta = !!myId && amParticipant;

  const status = String(tournament.status ?? "draft");
    const schemaRaw = String(tournament.match_schema ?? "numeric");
  const schema: MatchSchema = schemaRaw === "numeric" || schemaRaw === "winner" || schemaRaw === "sets" ? (schemaRaw as MatchSchema) : "numeric";
  const scheduleMode = String(tournament.schedule_mode ?? "rr1");

  const totalMatches = matches.length;
  const playedMatches = matches.filter(isPlayed).length;
  const pendingMatches = totalMatches - playedMatches;

  const progress = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0;
  const next = React.useMemo(() => nextUpcoming(matches, nowMs), [matches, nowMs]);

  const joinAction = React.useMemo(() => joinTournamentAction.bind(null, groupId, tournamentId), [groupId, tournamentId]);
  const leaveAction = React.useMemo(() => leaveTournamentAction.bind(null, groupId, tournamentId), [groupId, tournamentId]);
  const generateAction = React.useMemo(
    () => generateScheduleAction.bind(null, groupId, tournamentId),
    [groupId, tournamentId]
  );
  const startAction = React.useMemo(() => startTournamentAction.bind(null, groupId, tournamentId), [groupId, tournamentId]);
  const finishAction = React.useMemo(() => finishTournamentAction.bind(null, groupId, tournamentId), [groupId, tournamentId]);
  const manualMatchAction = React.useMemo(
    () => createManualMatchAction.bind(null, groupId, tournamentId),
    [groupId, tournamentId]
  );
  const scoreAction = React.useMemo(() => setMatchScoreAction.bind(null, groupId, tournamentId), [groupId, tournamentId]);

  const [scoreOpen, setScoreOpen] = React.useState(false);
  const [scoreMatch, setScoreMatch] = React.useState<MatchRow | null>(null);

  const openScore = (m: MatchRow) => {
    setScoreMatch(m);
    setScoreOpen(true);
  };
  const closeScore = () => {
    setScoreOpen(false);
    setScoreMatch(null);
  };

  const [createOpen, setCreateOpen] = React.useState(false);
  const [actionsOpen, setActionsOpen] = React.useState(false);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <main className={cn("mx-auto w-full max-w-3xl px-4 pt-4", showJoinCta || showLeaveCta ? "pb-44" : "pb-28")}>
        {/* Header móvil-first (sin "mega-card" mezclando todo) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              href={backHref}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              aria-label="Volver"
              title="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-600">
                {groupEmoji ? `${groupEmoji} ` : ""}
                {groupName}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="min-w-0 truncate text-lg font-extrabold tracking-tight text-slate-900">
                  {tournament.name}
                </h1>
                <Pill className={badgeForTournamentStatus(status)}>{status.toUpperCase()}</Pill>
              </div>

              <div className="mt-1 text-xs font-semibold text-slate-700">
                {labelKind(String(tournament.kind ?? "league"))} · {labelScheduleMode(scheduleMode)} ·{" "}
                {String(schema).toLowerCase()} · {participants.length} participantes
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* CTA móvil (rápido y muy visible) */}
            {myId && !amParticipant ? (
              <form action={joinAction} className="sm:hidden">
                <input type="hidden" name="returnTab" value={tab} />
                <button
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-md",
                    "bg-gradient-to-r from-indigo-600 to-violet-600",
                    "ring-2 ring-indigo-200 active:scale-[0.98]"
                  )}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" /> Participar
                  </span>
                </button>
              </form>
            ) : null}

            {myId && !amParticipant ? (
              <form action={joinAction} className="hidden sm:block">
                <input type="hidden" name="returnTab" value={tab} />
                <PrimaryButton className="px-4 py-2">
                  <CheckCircle2 className="h-4 w-4" /> Participar
                </PrimaryButton>
              </form>
            ) : null}

            {myId && amParticipant ? (
              <form action={leaveAction} className="hidden sm:block">
                <input type="hidden" name="returnTab" value={tab} />
                <SecondaryButton className="px-4 py-2">Salir</SecondaryButton>
              </form>
            ) : null}

            <GhostButton onClick={() => setActionsOpen(true)} title="Acciones">
              <MoreVertical className="h-5 w-5" />
            </GhostButton>
          </div>
        </div>

{/* Tabs sticky para no mezclar contenido */}
        <StickyTabs tab={tab} onTab={setTabAndUrl} />

        {/* Content */}
        <div className="mt-4 space-y-4">
          {tab === "overview" && (
            <OverviewTab
              status={status}
              isCreator={!!isCreator}
              participants={participants}
              matches={matches}
              standings={standings}
              entities={entities}
              next={next}
              progress={progress}
              playedMatches={playedMatches}
              totalMatches={totalMatches}
              pendingMatches={pendingMatches}
              scheduleMode={scheduleMode}
              schema={schema}
              tournament={tournament}
              onOpenActions={() => setActionsOpen(true)}
              onGoToMatches={() => setTabAndUrl("matches")}
              onGoToStandings={() => setTabAndUrl("standings")}
              onGoToPlayers={() => setTabAndUrl("players")}
            />
          )}

          {tab === "matches" && (
            <MatchesTab
              status={status}
              schema={schema}
              scheduleMode={scheduleMode}
              matches={matches}
              entities={entities}
              isCreator={!!isCreator}
              onOpenCreate={() => setCreateOpen(true)}
              onOpenScore={openScore}
              tab={tab}
              generateAction={generateAction}
              participants={participants}
              onGoToPlayers={() => setTabAndUrl("players")}
            />
          )}

          {tab === "standings" && <StandingsTab standings={standings} formMap={formMap} />}

          {tab === "players" && <PlayersTab participants={participants} entities={entities} />}

          {tab === "settings" && (
            <SettingsTab
              tournament={tournament}
              isCreator={!!isCreator}
              status={status}
              participants={participants}
              matches={matches}
              tab={tab}
              onOpenCreate={() => setCreateOpen(true)}
              onOpenActions={() => setActionsOpen(true)}
              generateAction={generateAction}
              startAction={startAction}
              finishAction={finishAction}
            />
          )}
        </div>

        {/* Action sheet */}
        <ActionSheet
          open={actionsOpen}
          onClose={() => setActionsOpen(false)}
          isCreator={!!isCreator}
          status={status}
          hasParticipants={participants.length >= 2}
          hasMatches={matches.length > 0}
          tab={tab}
          onOpenManual={() => setCreateOpen(true)}
          generateAction={generateAction}
          startAction={startAction}
          finishAction={finishAction}
        />

        {/* Create match modal */}
        {createOpen && (
          <CreateManualMatchModal
            onClose={() => setCreateOpen(false)}
            action={manualMatchAction}
            participants={participants}
            entities={entities}
            returnTab={tab}
          />
        )}

        {/* Score modal */}
        <MatchScoreModal
          open={scoreOpen}
          onClose={closeScore}
          tournamentId={tournamentId}
          matchId={scoreMatch?.id ?? ""}
          schema={schema}
          action={scoreAction}
          defaultScoreA={scoreMatch?.score_a ?? null}
          defaultScoreB={scoreMatch?.score_b ?? null}
defaultSets={Array.isArray(scoreMatch?.score_payload?.sets) ? scoreMatch?.score_payload?.sets : []}
          returnTab={tab}
        />
      </main>

{/* Sticky CTA móvil (muy visible) */}
{showJoinCta ? (
  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-indigo-200 bg-indigo-50/90 px-4 pb-[calc(env(safe-area-inset-bottom,0)+12px)] pt-3 backdrop-blur">
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-extrabold text-slate-900">
          Aún no participas
          <span className="ml-2 font-semibold text-slate-600">— 1 toque y listo</span>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-indigo-700 ring-1 ring-indigo-200">
          Recomendado
        </span>
      </div>
      <form action={joinAction}>
        <input type="hidden" name="returnTab" value={tab} />
        <button className="relative w-full overflow-hidden rounded-2xl px-5 py-4 text-base font-extrabold text-white shadow-xl ring-1 ring-indigo-300/70 focus:outline-none focus:ring-4 focus:ring-indigo-200 active:scale-[0.99]">
          <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600" />
          <span className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_10%,white,transparent_45%)]" />
          <span className="relative inline-flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Participar en el torneo
          </span>
        </button>
      </form>

      <div className="mt-2 text-xs font-semibold text-slate-700">
        Después podrás gestionar <b>Partidos</b> y ver la <b>Tabla</b> sin lío.
      </div>
    </div>
  </div>
) : null}

{showLeaveCta ? (
  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/85 px-4 pb-[calc(env(safe-area-inset-bottom,0)+12px)] pt-3 backdrop-blur sm:hidden">
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
        <div className="flex min-w-0 items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-slate-900">Participando</div>
            <div className="text-xs font-semibold text-slate-600">Ya estás dentro</div>
          </div>
        </div>

        <form action={leaveAction}>
          <input type="hidden" name="returnTab" value={tab} />
          <button className="rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100">
            Salir
          </button>
        </form>
      </div>
    </div>
  </div>
) : null}

    </div>
  );
}


function OverviewTab({
  status,
  isCreator,
  participants,
  matches,
  standings,
  entities,
  next,
  progress,
  playedMatches,
  totalMatches,
  pendingMatches,
  scheduleMode,
  schema,
  tournament,
  onOpenActions,
  onGoToMatches,
  onGoToStandings,
  onGoToPlayers,
}: {
  status: string;
  isCreator: boolean;
  participants: string[];
  matches: MatchRow[];
  standings: StandingRow[];
  entities: Record<string, Entity>;
  next: MatchRow | null;
  progress: number;
  playedMatches: number;
  totalMatches: number;
  pendingMatches: number;
  scheduleMode: string;
  schema: string;
  tournament: any;
  onOpenActions: () => void;
  onGoToMatches: () => void;
  onGoToStandings: () => void;
  onGoToPlayers: () => void;
}) {
  const leader = standings[0]?.label ?? "—";
  const top = standings.slice(0, 3);

  const hasParticipants = participants.length >= 2;
  const hasMatches = matches.length > 0;

  const showSetup = isCreator && String(status ?? "").toLowerCase() === "draft" && (!hasParticipants || !hasMatches);

  return (
    <div className="space-y-3">
      {/* 1) Setup (solo creador) - en acordeón para no mezclar todo */}
      {showSetup ? (
        <AccordionCard
          tone="amber"
          defaultOpen
          title="Puesta en marcha"
          subtitle="Haz estos pasos y ya podrás usar el torneo sin lío en móvil."
          right={
            <GhostButton onClick={onOpenActions}>
              <MoreVertical className="h-5 w-5" />
              Acciones
            </GhostButton>
          }
        >
          <div className="space-y-2">
            <StepRow
              done={hasParticipants}
              title="1) Participantes"
              desc={hasParticipants ? `${participants.length} participantes` : "Añade al menos 2"}
              actionLabel="Abrir"
              onAction={onGoToPlayers}
            />

            <StepRow
              done={true}
              title="2) Formato"
              desc={`${labelScheduleMode(scheduleMode)} · Resultado: ${String(schema).toLowerCase()}`}
              actionLabel="OK"
              onAction={() => {}}
              disabled
            />

            <StepRow
              done={hasMatches}
              title="3) Partidos"
              desc={hasMatches ? `${matches.length} partidos creados` : "Genera calendario o añade manual"}
              actionLabel="Abrir"
              onAction={onGoToMatches}
            />
          </div>

          <div className="mt-3 grid gap-2">
            <PrimaryButton onClick={onOpenActions} className="w-full">
              <Wand2 className="h-4 w-4" /> Generar / gestionar
            </PrimaryButton>
            <SecondaryButton onClick={onGoToMatches} className="w-full">
              <Swords className="h-4 w-4" /> Ir a Partidos
            </SecondaryButton>
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
            Puntos (W/D/L): <b>{Number(tournament.points_win ?? 3)}</b> / <b>{Number(tournament.points_draw ?? 1)}</b> /{" "}
            <b>{Number(tournament.points_loss ?? 0)}</b>
          </div>
        </AccordionCard>
      ) : null}

      {/* 2) Lo importante ahora (por defecto abierto) */}
      <AccordionCard
        tone="indigo"
        defaultOpen={!showSetup}
        title="Ahora"
        subtitle="Próximo partido y progreso del torneo."
        right={
          <Pill className="bg-slate-900 text-white">
            {progress}%
          </Pill>
        }
      >
        {next ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-slate-900">
                  {entities[next.player_a]?.label ?? "A"} <span className="text-slate-400">vs</span>{" "}
                  {entities[next.player_b]?.label ?? "B"}
                </div>
                <div className="mt-1 text-xs text-slate-600">{next.starts_at ? fmtWhen(next.starts_at) : "Sin fecha"}</div>
              </div>
              <Pill className={badgeForMatchStatus(next.status)}>{String(next.status ?? "").toUpperCase()}</Pill>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            {isCreator
              ? "Aún no hay partidos. Abre “Acciones” y genera el calendario."
              : "Aún no hay partidos. Pídele al creador que genere el calendario."}
          </div>
        )}

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Progreso</span>
            <span>{playedMatches}/{totalMatches}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Jugados: <b>{playedMatches}</b> · Pendientes: <b>{pendingMatches}</b> · Total: <b>{totalMatches}</b>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <SecondaryButton onClick={onGoToMatches} className="w-full">
            <Swords className="h-4 w-4" /> Partidos
          </SecondaryButton>
          <SecondaryButton onClick={onGoToStandings} className="w-full">
            <Trophy className="h-4 w-4" /> Tabla
          </SecondaryButton>
        </div>
      </AccordionCard>

      {/* 3) Clasificación (resumen corto; tabla completa en su tab) */}
      <AccordionCard
        tone="emerald"
        title="Clasificación"
        subtitle="Resumen rápido (la tabla completa está en “Tabla”)."
        right={<GhostButton onClick={onGoToStandings}>Ver</GhostButton>}
      >
        {standings.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            Aún no hay clasificación (juega o carga resultados).
          </div>
        ) : (
          <div className="space-y-2">
            {top.map((r, i) => (
              <div key={r.id} className={cn("flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3",
                i === 0 ? "bg-indigo-50" : "bg-white"
              )}>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-slate-900">
                    #{i + 1} · {r.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">PJ {r.played} · W {r.won} · D {r.drawn} · L {r.lost}</div>
                </div>
                <Pill className="bg-slate-900 text-white">{r.points} pts</Pill>
              </div>
            ))}
            <div className="text-xs text-slate-600">
              Líder: <b>{leader}</b>
            </div>
          </div>
        )}
      </AccordionCard>

      {/* 4) Participantes (resumen; gestión en su tab) */}
      <AccordionCard
        tone="sky"
        title="Participantes"
        subtitle="Quién juega este torneo."
        right={<GhostButton onClick={onGoToPlayers}>Abrir</GhostButton>}
      >
        {participants.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">Aún no hay participantes.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {participants.slice(0, 10).map((id) => (
              <span key={id} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-900">
                {entities[id]?.label ?? id}
              </span>
            ))}
            {participants.length > 10 ? (
              <span className="rounded-full bg-slate-200 px-3 py-2 text-xs font-extrabold text-slate-900">
                +{participants.length - 10}
              </span>
            ) : null}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <SecondaryButton onClick={onGoToPlayers} className="w-full">
            <Users className="h-4 w-4" /> Ver gente
          </SecondaryButton>
          <SecondaryButton onClick={onOpenActions} className="w-full">
            <Settings className="h-4 w-4" /> Acciones
          </SecondaryButton>
        </div>
      </AccordionCard>
    </div>
  );
}

function StepRow({
  done,
  title,
  desc,
  actionLabel,
  onAction,
  disabled,
}: {
  done: boolean;
  title: string;
  desc: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex min-w-0 items-start gap-2">
        {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />}
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">{title}</div>
          <div className="mt-0.5 text-xs text-slate-600">{desc}</div>
        </div>
      </div>

      <button
        onClick={onAction}
        disabled={disabled}
        className={cn(
          "shrink-0 rounded-full px-3 py-2 text-xs font-extrabold",
          disabled ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white hover:bg-slate-800"
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-slate-900">{value}</div>
    </div>
  );
}


function MatchesTab({
  status,
  schema,
  scheduleMode,
  matches,
  entities,
  isCreator,
  onOpenCreate,
  onOpenScore,
  tab,
  generateAction,
  participants,
  onGoToPlayers,
}: {
  status: string;
  schema: string;
  scheduleMode: string;
  matches: MatchRow[];
  entities: Record<string, Entity>;
  isCreator: boolean;
  onOpenCreate: () => void;
  onOpenScore: (m: MatchRow) => void;
  tab: string;
  generateAction: any;
  participants: string[];
  onGoToPlayers: () => void;
}) {
  const [filter, setFilter] = React.useState<"all" | "pending" | "played">("all");

  const grouped = React.useMemo(() => {
    const list = matches.filter((m) => {
      if (filter === "played") return isPlayed(m);
      if (filter === "pending") return !isPlayed(m);
      return true;
    });
    return groupByMatchday(list);
  }, [matches, filter]);

  const hasParticipants = participants.length >= 2;
  const controlsOpen = isCreator && matches.length === 0;

  return (
    <div className="space-y-3">
      {/* Crear / Generar (en acordeón para no “ensuciar” la pantalla) */}
      <AccordionCard
        tone="violet"
        defaultOpen={controlsOpen}
        title="Crear partidos"
        subtitle="Genera calendario o añade un partido manual. (Se queda aquí, no mezclado con la lista)."
        right={isCreator ? <Pill className="bg-slate-900 text-white">Creador</Pill> : undefined}
      >
        {isCreator ? (
          <div className="space-y-2">

<form action={generateAction}>
  <input type="hidden" name="returnTab" value={tab} />
  <button
    disabled={!hasParticipants}
    className={cn(
      "w-full rounded-2xl px-4 py-4 text-sm font-extrabold text-white shadow-md",
      "bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600",
      "focus:outline-none focus:ring-4 focus:ring-indigo-200 active:scale-[0.99]",
      !hasParticipants ? "opacity-50" : "hover:brightness-105"
    )}
  >
    <span className="inline-flex items-center justify-center gap-2">
      <Wand2 className="h-4 w-4" /> Generar calendario
    </span>
  </button>
</form>

<button
  type="button"
  onClick={onOpenCreate}
  className="w-full rounded-2xl bg-white px-4 py-4 text-sm font-extrabold text-slate-900 shadow-sm ring-1 ring-violet-200 hover:bg-violet-50 active:scale-[0.99]"
>
  <span className="inline-flex items-center justify-center gap-2">
    <Plus className="h-4 w-4" /> Añadir partido manual
  </span>
</button>

            {!hasParticipants ? (
  <div className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
    <div>Necesitas al menos 2 participantes para generar el calendario.</div>
    <button
      type="button"
      onClick={onGoToPlayers}
      className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-extrabold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-100"
    >
      <Users className="h-4 w-4" /> Añadir participantes
    </button>
  </div>
) : null}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            Solo el creador puede generar o añadir partidos.
          </div>
        )}

        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
          Formato: <b>{labelScheduleMode(scheduleMode)}</b> · Estado: <b>{String(status).toUpperCase()}</b> · Resultado:{" "}
          <b>{String(schema).toLowerCase()}</b>
        </div>
      </AccordionCard>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          ["all", "Todos"],
          ["pending", "Pendientes"],
          ["played", "Jugados"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-extrabold ring-1",
              filter === k
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-900 ring-slate-200 hover:bg-slate-100"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {grouped.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-extrabold text-slate-900">No hay partidos en este filtro</div>
          <div className="mt-1 text-xs text-slate-600">
            {matches.length === 0
              ? "Genera el calendario o añade uno manual desde “Crear partidos”."
              : "Cambia el filtro (Todos / Pendientes / Jugados)."}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([day, arr]) => (
            <MatchdayAccordion
              key={day}
              day={day}
              matches={arr}
              schema={schema}
              entities={entities}
              isCreator={isCreator}
              onOpenScore={onOpenScore}
            />
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
        Tip móvil: toca un partido para poner resultado (solo creador). Así la tabla se actualiza sola.
      </div>
    </div>
  );
}

function MatchdayAccordion({
  day,
  matches,
  schema,
  entities,
  isCreator,
  onOpenScore,
}: {
  day: number;
  matches: MatchRow[];
  schema: string;
  entities: Record<string, Entity>;
  isCreator: boolean;
  onOpenScore: (m: MatchRow) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const played = matches.filter(isPlayed).length;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left">
        <div>
          <div className="text-sm font-extrabold text-slate-900">Jornada {day}</div>
          <div className="mt-1 text-xs text-slate-600">{played}/{matches.length} jugados</div>
        </div>
        <div className="inline-flex items-center gap-2">
          <Pill className="bg-slate-100 text-slate-900">{matches.length}</Pill>
          <ChevronDown className={cn("h-5 w-5 transition", open ? "rotate-180" : "rotate-0")} />
        </div>
      </button>

      {open ? (
        <div className="mt-3 space-y-2">
          {matches.map((m) => {
            const a = entities[m.player_a]?.label ?? "A";
            const b = entities[m.player_b]?.label ?? "B";
            const s = scoreLabel(schema, m, entities);
            return (
              <button
                key={m.id}
                onClick={() => isCreator && onOpenScore(m)}
                className={cn(
                  "w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition",
                  isCreator ? "hover:bg-slate-50" : ""
                )}
                title={isCreator ? "Editar resultado" : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-slate-900">
                      {a} <span className="text-slate-400">vs</span> {b}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">{m.starts_at ? fmtWhen(m.starts_at) : "Sin fecha"}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Pill className={badgeForMatchStatus(m.status)}>{String(m.status ?? "").toUpperCase()}</Pill>
                    <Pill className="bg-slate-900 text-white">{s}</Pill>
                  </div>
                </div>
                {isCreator ? <div className="mt-2 text-xs text-slate-600">Toca para poner/editar resultado</div> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function StandingsTab({ standings, formMap }: { standings: StandingRow[]; formMap: Record<string, string[]> }) {
  return (
    <div className="space-y-3">
      <SectionCard tone="emerald" title="Clasificación" subtitle="Ordenada por puntos y diferencia">
        {standings.length === 0 ? (
  <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">Aún no hay datos de clasificación.</div>
) : (
  <div className="space-y-3">
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-emerald-50">
          <tr className="text-left text-xs font-extrabold text-emerald-900">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Equipo</th>
            <th className="px-3 py-2 text-right">PJ</th>
            <th className="px-3 py-2 text-right">W</th>
            <th className="px-3 py-2 text-right">D</th>
            <th className="px-3 py-2 text-right">L</th>
            <th className="px-3 py-2 text-right">Dif</th>
            <th className="px-3 py-2 text-right">Pts</th>
            <th className="px-3 py-2">Racha</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((r, idx) => {
            const form = (formMap[r.id] ?? []).slice(0, 5);
            const rowTone = idx === 0 ? "bg-emerald-50/50" : "bg-white";
            return (
              <tr key={r.id} className={cn("border-t border-slate-200", rowTone)}>
                <td className="px-3 py-3 align-top text-xs font-extrabold text-slate-900">{idx + 1}</td>
                <td className="px-3 py-3 align-top">
                  <div className="max-w-[220px] truncate font-extrabold text-slate-900">{r.label}</div>
                </td>
                <td className="px-3 py-3 align-top text-right text-xs font-bold text-slate-700">{r.played}</td>
                <td className="px-3 py-3 align-top text-right text-xs font-bold text-slate-700">{r.won}</td>
                <td className="px-3 py-3 align-top text-right text-xs font-bold text-slate-700">{r.drawn}</td>
                <td className="px-3 py-3 align-top text-right text-xs font-bold text-slate-700">{r.lost}</td>
                <td className="px-3 py-3 align-top text-right text-xs font-bold text-slate-700">{r.diff}</td>
                <td className="px-3 py-3 align-top text-right font-extrabold text-slate-900">{r.points}</td>
                <td className="px-3 py-3 align-top">
                  <div className="flex flex-wrap gap-1">
                    {form.length === 0 ? (
                      <span className="text-xs font-semibold text-slate-500">—</span>
                    ) : (
                      form.map((x, i) => (
                        <span
                          key={i}
                          className={cn(
                            "rounded-full px-2 py-1 text-[11px] font-extrabold",
                            x === "W"
                              ? "bg-emerald-100 text-emerald-900"
                              : x === "D"
                              ? "bg-amber-100 text-amber-900"
                              : x === "L"
                              ? "bg-rose-100 text-rose-900"
                              : "bg-slate-200 text-slate-900"
                          )}
                        >
                          {x}
                        </span>
                      ))
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    <div className="rounded-2xl bg-white/70 p-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
      Orden: puntos → diferencia. <span className="text-slate-500">Racha = últimos resultados (W/D/L).</span>
    </div>
  </div>
)}
      </SectionCard>

      {/* Desktop table is fine later; móvil-first aquí */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
        Tip: si quieres una tabla tipo Excel en desktop, lo añadimos después (pero en móvil esto se entiende mejor).
      </div>
    </div>
  );
}

function PlayersTab({ participants, entities }: { participants: string[]; entities: Record<string, Entity> }) {
  const list = participants.map((id) => entities[id] ?? ({ id, kind: "competitor", label: id } as Entity));

  return (
    <SectionCard tone="sky" title="Participantes" subtitle="Lista clara en móvil">
      {list.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">Aún no hay participantes.</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-slate-900">{e.label}</div>
                <div className="mt-1 text-xs text-slate-600">{e.kind === "user" ? "Usuario" : "Invitado"}</div>
              </div>
              <Pill className={e.kind === "user" ? "bg-indigo-100 text-indigo-900" : "bg-slate-200 text-slate-900"}>
                {e.kind === "user" ? "U" : "I"}
              </Pill>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
        Próximo paso: en el siguiente sprint añadimos gestión completa (añadir invitados, renombrar, eliminar, etc.).
      </div>
    </SectionCard>
  );
}


function SettingsTab({
  tournament,
  isCreator,
  status,
  participants,
  matches,
  tab,
  onOpenCreate,
  onOpenActions,
  generateAction,
  startAction,
  finishAction,
}: {
  tournament: any;
  isCreator: boolean;
  status: string;
  participants: string[];
  matches: MatchRow[];
  tab: string;
  onOpenCreate: () => void;
  onOpenActions: () => void;
  generateAction: any;
  startAction: any;
  finishAction: any;
}) {
  const s = (status ?? "draft").toLowerCase();
  const hasParticipants = participants.length >= 2;
  const hasMatches = matches.length > 0;

  const formatSummary = `${labelKind(String(tournament.kind ?? "league"))} · ${labelScheduleMode(
    String(tournament.schedule_mode ?? "rr1")
  )}`;

  return (
    <div className="space-y-3">
      <AccordionCard
        tone="slate"
        defaultOpen={false}
        title="Formato y reglas"
        subtitle="Todo lo de configuración, separado para no ensuciar la pantalla."
        right={<Pill className="bg-white text-slate-900 ring-1 ring-slate-200">{formatSummary}</Pill>}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoTile label="Tipo" value={labelKind(String(tournament.kind ?? "league"))} />
          <InfoTile label="Estado" value={String(tournament.status ?? "draft").toUpperCase()} />
          <InfoTile label="Calendario" value={labelScheduleMode(String(tournament.schedule_mode ?? "rr1"))} />
          <InfoTile label="Resultado" value={String(tournament.match_schema ?? "numeric")} />
          <InfoTile
            label="Puntos (W/D/L)"
            value={`${Number(tournament.points_win ?? 3)} / ${Number(tournament.points_draw ?? 1)} / ${Number(
              tournament.points_loss ?? 0
            )}`}
          />
          <InfoTile label="Ida/Vuelta" value={String(tournament.return_legs ?? "off")} />
        </div>

        <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
          Consejo móvil: usa <b>Partidos</b> para meter resultados y <b>Tabla</b> para ver la clasificación.
        </div>
      </AccordionCard>

      <SectionCard
        tone="violet"
        title="Acciones del torneo"
        subtitle="Lo importante y funcional, en una zona clara."
        right={isCreator ? <Pill className="bg-slate-900 text-white">CREADOR</Pill> : undefined}
      >
        {!isCreator ? (
          <div className="rounded-2xl bg-white/70 p-3 text-sm text-slate-800 ring-1 ring-slate-200">
            Solo el creador puede generar partidos o cambiar el estado del torneo.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Partidos */}
            <div className="grid gap-2">
              <form action={generateAction}>
                <input type="hidden" name="returnTab" value={tab} />
                <button
                  className={cn(
                    "w-full rounded-2xl px-4 py-4 text-sm font-extrabold text-white shadow-md",
                    "bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200",
                    !hasParticipants ? "opacity-50 hover:bg-violet-600" : ""
                  )}
                  disabled={!hasParticipants}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Wand2 className="h-4 w-4" /> Generar calendario
                  </span>
                </button>
              </form>

              <button
                onClick={onOpenCreate}
                className="w-full rounded-2xl bg-violet-50 px-4 py-4 text-sm font-extrabold text-violet-900 ring-1 ring-violet-200 hover:bg-violet-100"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> Añadir partido manual
                </span>
              </button>
            </div>

            {/* Estado */}
            <div className="grid gap-2 sm:grid-cols-2">
              {s === "draft" ? (
                <form action={startAction}>
                  <input type="hidden" name="returnTab" value={tab} />
                  <button
                    className={cn(
                      "w-full rounded-2xl px-4 py-4 text-sm font-extrabold text-white shadow-md",
                      "bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200",
                      !hasMatches ? "opacity-50 hover:bg-emerald-600" : ""
                    )}
                    disabled={!hasMatches}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Play className="h-4 w-4" /> Iniciar torneo
                    </span>
                  </button>
                </form>
              ) : null}

              {s === "running" ? (
                <form action={finishAction}>
                  <input type="hidden" name="returnTab" value={tab} />
                  <button className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-extrabold text-white shadow-md hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200">
                    <span className="inline-flex items-center justify-center gap-2">
                      <Flag className="h-4 w-4" /> Finalizar torneo
                    </span>
                  </button>
                </form>
              ) : null}

              <button
                onClick={onOpenActions}
                className={cn(
                  "w-full rounded-2xl bg-white px-4 py-4 text-sm font-extrabold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50",
                  s === "finished" ? "sm:col-span-2" : ""
                )}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <MoreVertical className="h-4 w-4" /> Más acciones
                </span>
              </button>
            </div>

            {!hasParticipants ? (
              <div className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/70">
                Necesitas al menos <b>2 participantes</b> para generar calendario.
              </div>
            ) : null}

            {s === "draft" && !hasMatches ? (
              <div className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/70">
                Para iniciar: crea partidos (generar o manual).
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

      <AccordionCard tone="rose" title="Zona peligrosa" subtitle="Acciones irreversibles (aún no activadas)." defaultOpen={false}>
        <button
          disabled
          className="w-full cursor-not-allowed rounded-2xl bg-white px-4 py-4 text-sm font-extrabold text-rose-700 ring-1 ring-rose-200/70 opacity-70"
        >
          Eliminar torneo (próximamente)
        </button>
        <div className="mt-2 text-xs font-semibold text-slate-700">
          Cuando lo activemos, pedirá confirmación doble para evitar errores.
        </div>
      </AccordionCard>
    </div>
  );
}


function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function CreateManualMatchModal({
  onClose,
  action,
  participants,
  entities,
  returnTab,
}: {
  onClose: () => void;
  action: any;
  participants: string[];
  entities: Record<string, Entity>;
  returnTab: string;
}) {
  const [a, setA] = React.useState(participants[0] ?? "");
  const [b, setB] = React.useState(participants[1] ?? participants[0] ?? "");
  const [matchday, setMatchday] = React.useState("1");
  const [startsAt, setStartsAt] = React.useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-base font-extrabold">Añadir partido</div>
              <div className="mt-1 text-xs text-slate-600">Crea un match manual sin regenerar el calendario.</div>
            </div>
            <GhostButton onClick={onClose}>Cerrar</GhostButton>
          </div>

          <form action={action} onSubmit={onClose} className="mt-4 space-y-3">
            <input type="hidden" name="returnTab" value={returnTab} />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-600">A</label>
                <select
                  value={a}
                  onChange={(e) => setA(e.target.value)}
                  name="a"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  {participants.map((id) => (
                    <option key={id} value={id}>
                      {entities[id]?.label ?? id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">B</label>
                <select
                  value={b}
                  onChange={(e) => setB(e.target.value)}
                  name="b"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  {participants.map((id) => (
                    <option key={id} value={id}>
                      {entities[id]?.label ?? id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-600">Jornada</label>
                <input
                  name="matchday"
                  type="number"
                  min={1}
                  value={matchday}
                  onChange={(e) => setMatchday(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Fecha (opcional)</label>
                <input
                  name="startsAt"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-200"
                />
              </div>
            </div>

            <PrimaryButton disabled={!a || !b || a === b} className="w-full">
              <Plus className="h-4 w-4" /> Crear partido
            </PrimaryButton>

            {a === b ? <div className="text-xs font-semibold text-rose-700">A y B no pueden ser el mismo participante.</div> : null}
          </form>
        </div>
      </div>
    </div>
  );
}


