import { createClient } from "@/lib/supabase/server";

/** Tipos base */
export type TournamentKind = "league" | "cup";
export type TournamentStatus = "draft" | "running" | "active" | "finished";

export type Tournament = {
  id: string;
  group_id: string;
  name: string;
  kind: TournamentKind;
  status: TournamentStatus;
  scoring_mode: string;
  schedule_mode?: string | null;
  points_win: number;
  points_draw: number;
  points_loss: number;
  allow_draws?: boolean | null;
  tiebreak_order?: string[] | null;
  created_by: string;
  created_at: string;
};

export type TournamentMatch = {
  id: string;
  tournament_id: string;
  matchday: number | null;
  player_a: string;
  player_b: string;
  score_a: number | null;
  score_b: number | null;
  score_payload: any | null;
  status: "scheduled" | "played" | "cancelled";
  scheduled_at?: string | null;
  location?: string | null;
  locked?: boolean | null;
  played_at?: string | null;
  created_by?: string | null;
  created_at?: string | null;
};

const DEFAULT_TIEBREAK_ORDER = ["points", "h2h_points", "h2h_diff", "diff", "scored", "random"];
const DEFAULT_ALLOW_DRAWS = true;

function isMissingColumnError(msg: string, col: string) {
  const m = String(msg ?? "").toLowerCase();
  const c = String(col ?? "").toLowerCase();
  return m.includes("column") && m.includes(c) && (m.includes("does not exist") || m.includes("not exist"));
}

function safeStr(x: any, max = 120) {
  return String(x ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function safeInt(x: any, fallback: number) {
  const n = Number(String(x ?? "").trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function listTournaments(groupId: string): Promise<Tournament[]> {
  const supabase = await createClient();
  const baseSelect =
    "id,group_id,name,kind,status,scoring_mode,schedule_mode,points_win,points_draw,points_loss,created_by,created_at,allow_draws,tiebreak_order";
  let res: any = await supabase
    .from("tournaments")
    .select(baseSelect)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  // Compat: si faltan columnas en schema, reintenta select sin ellas
  if (res.error && (isMissingColumnError(res.error.message, "tournaments.tiebreak_order") || isMissingColumnError(res.error.message, "tournaments.schedule_mode"))) {
    const fallbackSelect =
      "id,group_id,name,kind,status,scoring_mode,points_win,points_draw,points_loss,created_by,created_at";
    res = await supabase.from("tournaments").select(fallbackSelect).eq("group_id", groupId).order("created_at", { ascending: false });
  }

  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as any;
}

export async function getTournament(tournamentId: string): Promise<Tournament> {
  const supabase = await createClient();
  const baseSelect =
    "id,group_id,name,kind,status,scoring_mode,schedule_mode,points_win,points_draw,points_loss,created_by,created_at,allow_draws,tiebreak_order";
  let res: any = await supabase.from("tournaments").select(baseSelect).eq("id", tournamentId).single();

  if (res.error && (isMissingColumnError(res.error.message, "tournaments.tiebreak_order") || isMissingColumnError(res.error.message, "tournaments.schedule_mode"))) {
    const fallbackSelect =
      "id,group_id,name,kind,status,scoring_mode,points_win,points_draw,points_loss,created_by,created_at";
    res = await supabase.from("tournaments").select(fallbackSelect).eq("id", tournamentId).single();
  }

  if (res.error) throw new Error(res.error.message);

  const t: any = res.data ?? {};
  t.allow_draws = typeof t.allow_draws === "boolean" ? t.allow_draws : DEFAULT_ALLOW_DRAWS;
  t.tiebreak_order = Array.isArray(t.tiebreak_order) ? t.tiebreak_order : DEFAULT_TIEBREAK_ORDER;
  return t as any;
}

export async function createTournament(input: {
  groupId: string;
  name: string;
  kind: TournamentKind;
  scoringMode: string;
  scheduleMode?: string;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  allowDraws?: boolean;
  tiebreakOrder?: string[];
}) {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const basePayload: any = {
    group_id: input.groupId,
    name: input.name,
    kind: input.kind,
    status: "draft",
    scoring_mode: input.scoringMode,
    schedule_mode: (input.scheduleMode === "rr2" || input.scheduleMode === "manual" ? input.scheduleMode : "rr1"),
    points_win: input.pointsWin,
    points_draw: input.pointsDraw,
    points_loss: input.pointsLoss,
    created_by: uid,
  };

  const payloadWithRules: any = {
    ...basePayload,
    allow_draws: typeof input.allowDraws === "boolean" ? input.allowDraws : Number(input.pointsDraw ?? 0) > 0,
    tiebreak_order: Array.isArray(input.tiebreakOrder) && input.tiebreakOrder.length ? input.tiebreakOrder : DEFAULT_TIEBREAK_ORDER,
  };

  // intentos por si el CHECK de scoring_mode es estricto
  const candidates = [
    input.scoringMode,
    String(input.scoringMode ?? "").toLowerCase(),
    "wdl",
    "wld",
    "points",
    "win_draw_loss",
    "win_loss_draw",
    "wl",
    "win_only",
    "sets",
  ].map((x) => String(x || "").trim()).filter(Boolean);

  const uniqCandidates = Array.from(new Set(candidates));

  const tryInsert = async (payload: any) =>
    await supabase.from("tournaments").insert(payload).select("id").single();

  let lastErr: any = null;

  for (const mode of uniqCandidates) {
    const pBase = { ...basePayload, scoring_mode: mode };
    const pRules = { ...payloadWithRules, scoring_mode: mode };

    let res = await tryInsert(pRules);

    if (
      res.error &&
      (isMissingColumnError(res.error.message, "tournaments.tiebreak_order") ||
        isMissingColumnError(res.error.message, "tournaments.schedule_mode") ||
        isMissingColumnError(res.error.message, "tournaments.allow_draws"))
    ) {
      res = await tryInsert(pBase);
    }

    if (!res.error) return res.data as any;

    lastErr = res.error;
    const msg = String(res.error.message ?? "");
    if (msg.includes("scoring_mode_check") || msg.includes("tournaments_scoring_mode_check")) continue;

    throw new Error(res.error.message);
  }

  throw new Error(String((lastErr as any)?.message ?? "create_failed"));
}

// participants: tournament_id + user_id
export async function listParticipants(tournamentId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_participants")
    .select("user_id")
    .eq("tournament_id", tournamentId)
    .order("user_id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => String(r.user_id ?? "")).filter(Boolean);
}

export type ParticipantEntity = { id: string; kind: "user" | "competitor"; label: string };

export async function listParticipantEntities(ids: string[]): Promise<Record<string, ParticipantEntity>> {
  const uniq = Array.from(new Set((ids ?? []).filter(Boolean)));
  if (!uniq.length) return {};

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", uniq);

  if (error) throw new Error(error.message);

  const out: Record<string, ParticipantEntity> = {};
  for (const r of data ?? []) {
    const id = String((r as any).id ?? "");
    out[id] = { id, kind: "user", label: safeStr((r as any).full_name || "User", 80) };
  }

  // fallback si algún id no existe en profiles
  for (const id of uniq) {
    if (!out[id]) out[id] = { id, kind: "user", label: `User ${id.slice(0, 6)}` };
  }
  return out;
}

export async function isParticipant(tournamentId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_participants")
    .select("user_id")
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

export async function joinTournament(arg: string | { tournamentId: string }) {
  const tournamentId = typeof arg === "string" ? arg : arg.tournamentId;
  if (!tournamentId) throw new Error("missing_tournament_id");

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const { error } = await supabase.from("tournament_participants").insert({
    tournament_id: tournamentId,
    user_id: uid,
  } as any);

  // si ya existe, no fallamos duro
  if (error && !String(error.message).toLowerCase().includes("duplicate") && !String(error.message).toLowerCase().includes("unique")) {
    throw new Error(error.message);
  }
}

export async function leaveTournament(arg: string | { tournamentId: string }) {
  const tournamentId = typeof arg === "string" ? arg : arg.tournamentId;
  if (!tournamentId) throw new Error("missing_tournament_id");

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const { error } = await supabase
    .from("tournament_participants")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("user_id", uid);

  if (error) throw new Error(error.message);
}

export async function listMatches(tournamentId: string): Promise<TournamentMatch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_matches")
    .select("id,tournament_id,matchday,player_a,player_b,score_a,score_b,score_payload,status,scheduled_at,location,locked,played_at,created_by,created_at")
    .eq("tournament_id", tournamentId)
    .order("matchday", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as any;
}
/** Genera emparejamientos simples Round Robin (rr1 / rr2) */
export async function generateTournamentMatches(arg: string | { tournamentId: string }) {
  const tournamentId = typeof arg === "string" ? arg : arg.tournamentId;
  if (!tournamentId) throw new Error("missing_tournament_id");

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const t = await getTournament(tournamentId);
  const participants = await listParticipants(tournamentId);
  if (participants.length < 2) throw new Error("not_enough_participants");

  // limpieza previa
  await supabase.from("tournament_matches").delete().eq("tournament_id", tournamentId);

  const rr2 = String(t.schedule_mode ?? "") === "rr2";
  const rounds = rr2 ? 2 : 1;

  // algoritmo round robin (circle method)
  const arr = [...participants];
  if (arr.length % 2 === 1) arr.push("__BYE__");
  const n = arr.length;
  const half = n / 2;

  const allRows: any[] = [];
  for (let r = 0; r < (n - 1) * rounds; r++) {
    const roundIndex = r % (n - 1);
    const leg = Math.floor(r / (n - 1)); // 0 o 1
    const left = arr.slice(0, half);
    const right = arr.slice(half).reverse();

    for (let i = 0; i < half; i++) {
      const a0 = left[i];
      const b0 = right[i];
      if (a0 === "__BYE__" || b0 === "__BYE__") continue;

      const a = leg === 0 ? a0 : b0;
      const b = leg === 0 ? b0 : a0;

      allRows.push({
        tournament_id: tournamentId,
        matchday: roundIndex + 1,
        player_a: a,
        player_b: b,
        status: "scheduled",
        created_by: uid,
      });
    }

    // rotación
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as any);
    arr.splice(0, arr.length, fixed, ...rest);
  }

  const { error } = await supabase.from("tournament_matches").insert(allRows as any);
  if (error) throw new Error(error.message);
}

export async function createManualMatch(input: { tournamentId: string; a?: string; b?: string; homeId?: string; awayId?: string; matchday?: number; scheduledAt?: string | null; location?: string | null }) {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const a = input.homeId ?? input.a ?? "";
  const b = input.awayId ?? input.b ?? "";
  if (!a || !b || a === b) throw new Error("invalid_players");

  const matchday = Number(input.matchday ?? 1);
  const scheduledAt = input.scheduledAt || null;
  const location = input.location ? safeStr(input.location, 120) : null;

  const { error } = await supabase.from("tournament_matches").insert({
    tournament_id: input.tournamentId,
    player_a: a,
    player_b: b,
    matchday: Number.isFinite(matchday) ? Math.max(1, Math.trunc(matchday)) : 1,
    scheduled_at: scheduledAt,
    location,
    status: "scheduled",
    created_by: uid,
  } as any);

  if (error) throw new Error(error.message);
}

export async function setTournamentStatus(
  arg: string | { tournamentId: string; status: TournamentStatus },
  maybeStatus?: TournamentStatus
) {
  const tournamentId = typeof arg === "string" ? arg : arg.tournamentId;
  const status: TournamentStatus = (typeof arg === "string" ? maybeStatus : arg.status) as any;
  if (!tournamentId) throw new Error("missing_tournament_id");
  if (!status) throw new Error("missing_status");

  const supabase = await createClient();
  const { error } = await supabase.from("tournaments").update({ status } as any).eq("id", tournamentId);
  if (error) throw new Error(error.message);
}

export async function setMatchScore(input: { matchId: string; scoreA: number; scoreB: number; scorePayload?: any | null }) {
  const supabase = await createClient();
  const a = Number(input.scoreA);
  const b = Number(input.scoreB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error("invalid_score");

  const { data: mRow, error: mErr } = await supabase
    .from("tournament_matches")
    .select("id,tournament_id,matchday,locked")
    .eq("id", input.matchId)
    .maybeSingle();
  if (mErr) throw new Error(mErr.message);
  if (!mRow) throw new Error("match_not_found");
  if ((mRow as any).locked) throw new Error("match_locked");

  const md = Number((mRow as any).matchday ?? 0);
  if (md > 0) {
    const { data: dRow, error: dErr } = await supabase
      .from("tournament_matchdays")
      .select("is_closed")
      .eq("tournament_id", (mRow as any).tournament_id)
      .eq("matchday", md)
      .maybeSingle();
    if (dErr) throw new Error(dErr.message);
    if ((dRow as any)?.is_closed) throw new Error("matchday_closed");
  }

  const { error } = await supabase
    .from("tournament_matches")
    .update({
      score_a: a,
      score_b: b,
      score_payload: (input as any).scorePayload ?? null,
      status: "played",
      played_at: new Date().toISOString(),
    } as any)
    .eq("id", input.matchId);

  if (error) throw new Error(error.message);
}

export async function setMatchdayClosed(input: { tournamentId: string; matchday: number; closed: boolean }) {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const md = Number(input.matchday);
  if (!Number.isFinite(md) || md <= 0) throw new Error("invalid_matchday");

  const payload: any = {
    tournament_id: input.tournamentId,
    matchday: md,
    is_closed: !!input.closed,
    updated_at: new Date().toISOString(),
    updated_by: uid,
  };

  const { error } = await supabase
    .from("tournament_matchdays")
    .upsert(payload, { onConflict: "tournament_id,matchday" } as any);

  if (error) throw new Error(error.message);
}

export async function closeMatchday(input: { tournamentId: string; matchday: number }) {
  return setMatchdayClosed({ tournamentId: input.tournamentId, matchday: input.matchday, closed: true });
}

export async function reopenMatchday(input: { tournamentId: string; matchday: number }) {
  return setMatchdayClosed({ tournamentId: input.tournamentId, matchday: input.matchday, closed: false });
}

export async function updateMatchSchedule(input: { matchId: string; matchday?: number | null; scheduledAt?: string | null; location?: string | null }) {
  const supabase = await createClient();
  const md = input.matchday == null || input.matchday === ("" as any) ? null : Number(input.matchday);

  const payload: any = {
    matchday: md,
    scheduled_at: input.scheduledAt || null,
    location: input.location ? safeStr(input.location, 120) : null,
  };

  const { error } = await supabase.from("tournament_matches").update(payload).eq("id", input.matchId);
  if (error) throw new Error(error.message);
}

export async function toggleMatchLock(input: { matchId: string; locked: boolean }) {
  const supabase = await createClient();
  const { error } = await supabase.from("tournament_matches").update({ locked: !!input.locked } as any).eq("id", input.matchId);
  if (error) throw new Error(error.message);
}

export async function updateTournamentRules(input: { tournamentId: string; allowDraws?: boolean; pointsWin?: number; pointsDraw?: number; pointsLoss?: number; tiebreakOrder?: string[] }) {
  const supabase = await createClient();

  const payload: any = {};
  if (typeof input.allowDraws === "boolean") payload.allow_draws = input.allowDraws;
  if (Number.isFinite(input.pointsWin as any)) payload.points_win = Number(input.pointsWin);
  if (Number.isFinite(input.pointsDraw as any)) payload.points_draw = Number(input.pointsDraw);
  if (Number.isFinite(input.pointsLoss as any)) payload.points_loss = Number(input.pointsLoss);
  if (Array.isArray(input.tiebreakOrder) && input.tiebreakOrder.length) payload.tiebreak_order = input.tiebreakOrder;
  let res: any = await supabase.from("tournaments").update(payload).eq("id", input.tournamentId);

  if (res.error && (isMissingColumnError(res.error.message, "tournaments.tiebreak_order") || isMissingColumnError(res.error.message, "tournaments.allow_draws"))) {
    const retryPayload = { ...payload };
    delete (retryPayload as any).tiebreak_order;
    delete (retryPayload as any).allow_draws;
    res = await supabase.from("tournaments").update(retryPayload).eq("id", input.tournamentId);
  }

  if (res.error) throw new Error(res.error.message);
}

/** Helpers de tabla */
function computeH2H(t: Tournament, tied: string[], matches: TournamentMatch[]) {
  const win = Number(t.points_win ?? 3);
  const draw = Number(t.points_draw ?? 1);
  const loss = Number(t.points_loss ?? 0);
  const allowDraws = (t.allow_draws ?? (draw > 0)) ? true : false;

  const set = new Set(tied);
  const table: Record<string, any> = {};
  for (const p of tied) table[p] = { pts: 0, pf: 0, pc: 0 };

  for (const m of matches) {
    if (m.status !== "played") continue;
    if (m.score_a == null || m.score_b == null) continue;
    if (!set.has(m.player_a) || !set.has(m.player_b)) continue;

    const A = table[m.player_a];
    const B = table[m.player_b];
    A.pf += m.score_a; A.pc += m.score_b;
    B.pf += m.score_b; B.pc += m.score_a;

    if (m.score_a > m.score_b) {
      A.pts += win; B.pts += loss;
    } else if (m.score_a < m.score_b) {
      B.pts += win; A.pts += loss;
    } else if (allowDraws) {
      A.pts += draw; B.pts += draw;
    }
  }

  return table;
}

export function buildStandings(t: Tournament, participants: string[], matches: TournamentMatch[]) {
  const win = Number(t.points_win ?? 3);
  const draw = Number(t.points_draw ?? 1);
  const loss = Number(t.points_loss ?? 0);
  const allowDraws = (t.allow_draws ?? (draw > 0)) ? true : false;

  const table: Record<string, any> = {};
  for (const p of participants) {
    table[p] = { id: p, pj: 0, g: 0, e: 0, p: 0, pf: 0, pc: 0, pts: 0 };
  }

  for (const m of matches) {
    if (!table[m.player_a]) table[m.player_a] = { id: m.player_a, pj: 0, g: 0, e: 0, p: 0, pf: 0, pc: 0, pts: 0 };
    if (!table[m.player_b]) table[m.player_b] = { id: m.player_b, pj: 0, g: 0, e: 0, p: 0, pf: 0, pc: 0, pts: 0 };

    if (m.status !== "played") continue;
    if (m.score_a == null || m.score_b == null) continue;

    const A = table[m.player_a];
    const B = table[m.player_b];
    A.pj += 1; B.pj += 1;
    A.pf += m.score_a; A.pc += m.score_b;
    B.pf += m.score_b; B.pc += m.score_a;

    if (m.score_a > m.score_b) {
      A.g += 1; B.p += 1;
      A.pts += win; B.pts += loss;
    } else if (m.score_a < m.score_b) {
      B.g += 1; A.p += 1;
      B.pts += win; A.pts += loss;
    } else if (allowDraws) {
      A.e += 1; B.e += 1;
      A.pts += draw; B.pts += draw;
    } else {
      A.e += 1; B.e += 1;
    }
  }

  // orden básico: puntos, diff, pf
  const rows = Object.values(table).map((r: any) => ({ ...r, diff: (r.pf ?? 0) - (r.pc ?? 0) }));
  rows.sort((a: any, b: any) => (b.pts - a.pts) || (b.diff - a.diff) || (b.pf - a.pf) || String(a.id).localeCompare(String(b.id)));

  // desempate H2H si hay empate a puntos
  const byPts: Record<string, any[]> = {};
  for (const r of rows) {
    const k = String(r.pts);
    byPts[k] = byPts[k] || [];
    byPts[k].push(r);
  }

  for (const k of Object.keys(byPts)) {
    const tied = byPts[k];
    if (tied.length <= 1) continue;
    const ids = tied.map((x) => x.id);
    const h2h = computeH2H(t, ids, matches);

    tied.sort((a: any, b: any) => {
      const ha = h2h[a.id] || { pts: 0, pf: 0, pc: 0 };
      const hb = h2h[b.id] || { pts: 0, pf: 0, pc: 0 };
      const da = (ha.pf - ha.pc);
      const db = (hb.pf - hb.pc);
      return (hb.pts - ha.pts) || (db - da) || (hb.pf - ha.pf) || String(a.id).localeCompare(String(b.id));
    });
  }

  return rows;
}

export function buildFormMap(
  tournament: Tournament,
  participants: string[],
  matches: TournamentMatch[],
  lastN = 5
) {
  const map: Record<string, string[]> = {};
  for (const p of participants) map[p] = [];

  const played = (matches ?? []).filter(
    (m) => m.status === "played" && m.score_a != null && m.score_b != null
  );

  for (let i = played.length - 1; i >= 0; i--) {
    const m = played[i];
    const a = m.player_a;
    const b = m.player_b;
    if (!map[a]) map[a] = [];
    if (!map[b]) map[b] = [];

    let ra: "W" | "L" | "D" = "D";
    let rb: "W" | "L" | "D" = "D";

    if (Number(m.score_a) > Number(m.score_b)) { ra = "W"; rb = "L"; }
    else if (Number(m.score_a) < Number(m.score_b)) { ra = "L"; rb = "W"; }

    if (map[a].length < lastN) map[a].push(ra);
    if (map[b].length < lastN) map[b].push(rb);
  }

  for (const k of Object.keys(map)) map[k] = map[k].reverse();
  return map;
}


