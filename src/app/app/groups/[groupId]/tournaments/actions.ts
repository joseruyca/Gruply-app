"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createTournament,
  joinTournament,
  leaveTournament,
  generateTournamentMatches,
  setTournamentStatus,
  setMatchScore,
  createManualMatch,
  updateTournamentRules,
  closeMatchday,
  reopenMatchday,
  updateMatchSchedule,
  toggleMatchLock,
  TournamentKind,
  TournamentStatus,
} from "@/lib/tournaments/repo";

type ScheduleMode = "rr1" | "rr2" | "manual";
type MatchSchema = "numeric" | "winner" | "sets";

function safeText(x: any, max = 120) {
  return String(x ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
function safeInt(x: any, fallback: number) {
  const n = Number(String(x ?? "").trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function isTruthy(x: any) {
  const v = String(x ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes" || v === "si" || v === "sí";
}
function normalizeScheduleMode(x: any): ScheduleMode {
  const v = String(x ?? "").trim();
  if (v === "rr2") return "rr2";
  if (v === "manual") return "manual";
  return "rr1";
}
function normalizeSchema(x: any): MatchSchema {
  const v = String(x ?? "").trim();
  if (v === "winner") return "winner";
  if (v === "sets") return "sets";
  return "numeric";
}
function normalizeScoringMode(x: any): string {
  const v = String(x ?? "").trim();
  if (!v) return "wdl";

  const low = v.toLowerCase();
  const allowed = new Set([
    "wdl",
    "wld",
    "points",
    "win_draw_loss",
    "win_loss_draw",
    "wl",
    "win_only",
    "sets",
  ]);
  return allowed.has(low) ? low : "wdl";
}

async function requirePermOrThrow(groupId: string, tournamentId: string) {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) throw new Error("not_authenticated");

  // Debes ser miembro del grupo
  const { data: member, error: eMem } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", uid)
    .maybeSingle();

  if (eMem) throw new Error(eMem.message);
  if (!member) throw new Error("not_member");

  // Permiso simple: creador del grupo o creador del torneo
  const [{ data: g, error: eG }, { data: t, error: eT }] = await Promise.all([
    supabase.from("groups").select("created_by").eq("id", groupId).maybeSingle(),
    supabase.from("tournaments").select("created_by,group_id").eq("id", tournamentId).maybeSingle(),
  ]);

  if (eG) throw new Error(eG.message);
  if (eT) throw new Error(eT.message);

  if (t && String((t as any).group_id) !== String(groupId)) throw new Error("forbidden");

  const groupCreator = (g as any)?.created_by ?? null;
  const tournamentCreator = (t as any)?.created_by ?? null;

  if (uid !== groupCreator && uid !== tournamentCreator) throw new Error("forbidden");
}

function redirectToTournament(groupId: string, tournamentId: string, tab?: string) {
  const t = safeText(tab ?? "matches", 32);
  redirect(`/app/groups/${groupId}/tournaments/${tournamentId}?tab=${encodeURIComponent(t)}`);
}

// ---------------------------------------------------------
// Create tournament
// ---------------------------------------------------------
export async function createTournamentAction(groupId: string, formData: FormData) {
  const name = safeText(formData.get("name"), 60);
  const kindRaw = safeText(formData.get("kind"), 10);
  const kind: TournamentKind = kindRaw === "cup" ? "cup" : "league";

  const scoringMode = normalizeScoringMode(formData.get("scoringMode"));
  const scheduleMode = normalizeScheduleMode(formData.get("scheduleMode"));

  const pointsWin = safeInt(formData.get("pointsWin"), 3);
  const pointsDraw = safeInt(formData.get("pointsDraw"), 1);
  const pointsLoss = safeInt(formData.get("pointsLoss"), 0);

  const allowDraws = formData.has("allowDraws") ? isTruthy(formData.get("allowDraws")) : undefined;

  const tiebreakRaw = safeText(formData.get("tiebreakOrder"), 300);
  const tiebreakOrder =
    tiebreakRaw && tiebreakRaw.includes(",")
      ? tiebreakRaw.split(",").map((x) => x.trim()).filter(Boolean)
      : undefined;

  const res: any = await createTournament({
    groupId,
    name: name || "Torneo",
    kind,
    scoringMode,
    scheduleMode,
    pointsWin,
    pointsDraw,
    pointsLoss,
    allowDraws,
    tiebreakOrder,
  });

  const newId = String(res?.id ?? "");
  if (!newId) throw new Error("create_failed");

  revalidatePath(`/app/groups/${groupId}/tournaments`);
  redirectToTournament(groupId, newId, "matches");
}

// ---------------------------------------------------------
// Join / Leave
// ---------------------------------------------------------
export async function joinTournamentAction(groupId: string, tournamentId: string, formData: FormData) {
  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";
  await joinTournament({ tournamentId });
  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, returnTab);
}

export async function leaveTournamentAction(groupId: string, tournamentId: string, formData: FormData) {
  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";
  await leaveTournament({ tournamentId });
  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, returnTab);
}

// ---------------------------------------------------------
// Generate matches
// ---------------------------------------------------------
export async function generateMatchesAction(groupId: string, tournamentId: string, formData: FormData) {
  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";
  await requirePermOrThrow(groupId, tournamentId);
  await generateTournamentMatches({ tournamentId });
  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, returnTab);
}

export const generateScheduleAction = generateMatchesAction;

// ---------------------------------------------------------
// Status
// ---------------------------------------------------------
export async function setStatusAction(groupId: string, tournamentId: string, status: TournamentStatus, tab?: string) {
  await requirePermOrThrow(groupId, tournamentId);
  await setTournamentStatus({ tournamentId, status });
  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, tab ?? "matches");
}

export async function startTournamentAction(groupId: string, tournamentId: string, formData: FormData) {
  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";
  await setStatusAction(groupId, tournamentId, "running", returnTab);
}

export async function finishTournamentAction(groupId: string, tournamentId: string, formData: FormData) {
  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";
  await setStatusAction(groupId, tournamentId, "finished", returnTab);
}

// ---------------------------------------------------------
// Score
// ---------------------------------------------------------
export async function setMatchScoreAction(groupId: string, tournamentId: string, formData: FormData) {
  await requirePermOrThrow(groupId, tournamentId);

  const matchId = safeText(formData.get("matchId") ?? formData.get("match_id"), 80);
  if (!matchId) throw new Error("missing_match_id");

  const schema = normalizeSchema(formData.get("schema"));
  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";

  let scoreA = 0;
  let scoreB = 0;
  let scorePayload: any = null;

  if (schema === "numeric") {
    scoreA = safeInt(formData.get("scoreA"), 0);
    scoreB = safeInt(formData.get("scoreB"), 0);
  }

  if (schema === "winner") {
    const w = safeText(formData.get("winner"), 10);
    // Guardamos algo útil en payload; también dejamos score numérico para standings simples.
    if (w === "a") { scoreA = 1; scoreB = 0; scorePayload = { winner: "a" }; }
    else if (w === "b") { scoreA = 0; scoreB = 1; scorePayload = { winner: "b" }; }
    else { scoreA = 0; scoreB = 0; scorePayload = null; }
  }

  if (schema === "sets") {
    const count = safeInt(formData.get("setsCount"), 1);
    const sets: Array<{ a: number; b: number }> = [];

    for (let i = 0; i < Math.max(1, count); i++) {
      const a = safeInt(formData.get(`sets_${i}_a`), 0);
      const b = safeInt(formData.get(`sets_${i}_b`), 0);
      sets.push({ a, b });
      scoreA += a;
      scoreB += b;
    }

    scorePayload = { sets };
  }

  await setMatchScore({ matchId, scoreA, scoreB, scorePayload });

  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, returnTab);
}

// Alias por compat (si tu UI usa setScoreAction)
export const setScoreAction = setMatchScoreAction;

// ---------------------------------------------------------
// Manual match
// ---------------------------------------------------------
export async function createManualMatchAction(groupId: string, tournamentId: string, formData: FormData) {
  await requirePermOrThrow(groupId, tournamentId);

  const a = safeText(formData.get("a") ?? formData.get("playerA"), 80) || undefined;
  const b = safeText(formData.get("b") ?? formData.get("playerB"), 80) || undefined;

  const matchday = formData.get("matchday") == null ? undefined : safeInt(formData.get("matchday"), 1);
  const scheduledAt = safeText(formData.get("scheduledAt"), 60) || undefined;
  const location = safeText(formData.get("location"), 120) || undefined;

  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";

  await createManualMatch({
    tournamentId,
    a,
    b,
    matchday,
    scheduledAt,
    location,
  } as any);

  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, returnTab);
}

// ---------------------------------------------------------
// Rules
// ---------------------------------------------------------
export async function updateRulesAction(groupId: string, tournamentId: string, formData: FormData) {
  await requirePermOrThrow(groupId, tournamentId);

  const allowDraws = formData.has("allowDraws") ? isTruthy(formData.get("allowDraws")) : undefined;
  const pointsWin = formData.get("pointsWin") == null ? undefined : safeInt(formData.get("pointsWin"), 3);
  const pointsDraw = formData.get("pointsDraw") == null ? undefined : safeInt(formData.get("pointsDraw"), 1);
  const pointsLoss = formData.get("pointsLoss") == null ? undefined : safeInt(formData.get("pointsLoss"), 0);

  const tiebreakRaw = safeText(formData.get("tiebreakOrder"), 300);
  const tiebreakOrder =
    tiebreakRaw && tiebreakRaw.includes(",")
      ? tiebreakRaw.split(",").map((x) => x.trim()).filter(Boolean)
      : undefined;

  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";

  await updateTournamentRules({
    tournamentId,
    allowDraws,
    pointsWin,
    pointsDraw,
    pointsLoss,
    tiebreakOrder,
  });

  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, returnTab);
}

// ---------------------------------------------------------
// Matchday close/reopen
// ---------------------------------------------------------
export async function closeMatchdayAction(groupId: string, tournamentId: string, formData: FormData) {
  await requirePermOrThrow(groupId, tournamentId);
  const matchday = safeInt(formData.get("matchday"), 1);
  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";
  await closeMatchday({ tournamentId, matchday });
  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, returnTab);
}

export async function reopenMatchdayAction(groupId: string, tournamentId: string, formData: FormData) {
  await requirePermOrThrow(groupId, tournamentId);
  const matchday = safeInt(formData.get("matchday"), 1);
  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";
  await reopenMatchday({ tournamentId, matchday });
  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, returnTab);
}

// ---------------------------------------------------------
// Match schedule + lock
// ---------------------------------------------------------
export async function updateMatchScheduleAction(groupId: string, tournamentId: string, formData: FormData) {
  await requirePermOrThrow(groupId, tournamentId);

  const matchId = safeText(formData.get("matchId"), 80);
  if (!matchId) throw new Error("missing_match_id");

  const matchdayRaw = formData.get("matchday");
  const matchday =
    matchdayRaw == null || String(matchdayRaw).trim() === "" ? null : safeInt(matchdayRaw, 1);

  const scheduledAt = safeText(formData.get("scheduledAt"), 60) || null;
  const location = safeText(formData.get("location"), 120) || null;

  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";

  await updateMatchSchedule({
    matchId,
    matchday,
    scheduledAt,
    location,
  });

  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, returnTab);
}

export async function toggleMatchLockAction(groupId: string, tournamentId: string, formData: FormData) {
  await requirePermOrThrow(groupId, tournamentId);

  const matchId = safeText(formData.get("matchId"), 80);
  if (!matchId) throw new Error("missing_match_id");

  const locked = isTruthy(formData.get("locked"));
  const returnTab = safeText(formData.get("returnTab"), 32) || "matches";

  await toggleMatchLock({ matchId, locked });

  revalidatePath(`/app/groups/${groupId}/tournaments/${tournamentId}`);
  redirectToTournament(groupId, tournamentId, returnTab);
}

