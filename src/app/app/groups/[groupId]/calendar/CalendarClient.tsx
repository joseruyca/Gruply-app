"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, MapPin, Clock3, X } from "lucide-react";
import { calendarRsvpAction, createGroupEventAction } from "./actions";

type RSVP = "yes" | "maybe" | "no";

type EventItem = {
  id: string;
  title: string;
  starts_at: string;
  place: string | null;
  status: "published" | "cancelled" | string;
  created_by?: string | null;
};

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return ymd(d);
}

function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // Monday=0
  x.setDate(x.getDate() - dow);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function fmtMonth(d: Date) {
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function fmtDayLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "short" });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function clip(s: string, n: number) {
  const x = String(s ?? "");
  return x.length > n ? x.slice(0, n - 1) + "…" : x;
}

function toneFromStatus(status: string) {
  return status === "cancelled"
    ? { pill: "bg-rose-600 text-white border-rose-600", label: "Cancelado" }
    : { pill: "bg-emerald-600 text-white border-emerald-600", label: "Publicado" };
}

export default function CalendarClient({
  groupId,
  groupName,
  groupEmoji,
  canCreate,
  initialEvents,
  initialRsvps,
}: {
  groupId: string;
  groupName: string;
  groupEmoji: string | null;
  canCreate: boolean;
  initialEvents: EventItem[];
  initialRsvps: Record<string, RSVP>;
}) {
  const router = useRouter();

  // Hydration-safe: render minimal HTML on server; full UI only after mount.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [rsvps, setRsvps] = React.useState<Record<string, RSVP>>(initialRsvps ?? {});
  React.useEffect(() => setRsvps(initialRsvps ?? {}), [initialRsvps]);

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of initialEvents ?? []) {
      const k = dayKey(e.starts_at);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1));
      map.set(k, arr);
    }
    return map;
  }, [initialEvents]);

  const upcoming = React.useMemo(() => {
    const now = Date.now();
    return (initialEvents ?? []).filter((e) => {
      const ms = new Date(e.starts_at).getTime();
      return Number.isFinite(ms) ? ms >= now - 2 * 60 * 60 * 1000 : true;
    });
  }, [initialEvents]);

  const [monthCursor, setMonthCursor] = React.useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!mounted) return;
    const now = new Date();
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    setMonthCursor(cursor);

    // Selección por defecto: hoy si existe, si no el primer evento.
    const today = ymd(now);
    const firstEvent = (upcoming?.[0]?.starts_at ? dayKey(upcoming[0].starts_at) : today) as string;
    setSelectedDay(eventsByDay.has(today) ? today : firstEvent);
  }, [mounted, upcoming, eventsByDay]);

  const grid = React.useMemo(() => {
    if (!monthCursor) return [] as Date[];
    const start = startOfWeekMonday(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [monthCursor]);

  // Crear evento modal
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("20:00");
  const [place, setPlace] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function openCreate() {
    setErr(null);
    setTitle("");
    setPlace("");
    setNotes("");
    setTime("20:00");
    setDate(selectedDay ?? (mounted ? ymd(new Date()) : ""));
    setOpen(true);
  }

  function submitCreate() {
    setErr(null);

    const d = (date || "").trim();
    const t = (time || "").trim();
    if (!title.trim()) {
      setErr("Pon un título.");
      return;
    }
    if (!d || !t) {
      setErr("Elige fecha y hora.");
      return;
    }

    const iso = new Date(`${d}T${t}`).toISOString();

    const fd = new FormData();
    fd.set("groupId", groupId);
    fd.set("title", title);
    fd.set("startsAt", iso);
    if (place.trim()) fd.set("place", place.trim());
    if (notes.trim()) fd.set("notes", notes.trim());

    startTransition(async () => {
      try {
        await createGroupEventAction(fd);
        setOpen(false);
        router.refresh();
      } catch (e: any) {
        setErr(e?.message ? String(e.message) : "No se pudo crear el evento.");
      }
    });
  }

  const pillBase = "rounded-full px-3 py-1 text-xs font-bold border";
  const off = "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";
  const yesOn = "bg-emerald-600 text-white border-emerald-600";
  const maybeOn = "bg-amber-500 text-white border-amber-500";
  const noOn = "bg-rose-600 text-white border-rose-600";

  if (!mounted) {
    // Skeleton estable para evitar hydration mismatch.
    return (
      <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-28 pt-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="h-6 w-40 rounded-xl bg-slate-100" />
          <div className="mt-2 h-4 w-52 rounded-xl bg-slate-100" />
        </div>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="h-5 w-32 rounded-xl bg-slate-100" />
          <div className="mt-3 grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-10 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const selectedEvents = selectedDay ? eventsByDay.get(selectedDay) ?? [] : [];

  return (
    <main className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 pb-28 pt-6">
      {/* Header */}
     <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

        <div className="rounded-3xl bg-slate-950/90 p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/70">Calendario del grupo</div>
              <div className="mt-1 text-lg font-extrabold tracking-tight truncate">
                {(groupEmoji ? groupEmoji + " " : "")}{groupName}
              </div>
              <div className="mt-1 text-xs text-white/70">
                Confirma asistencia aquí (sin ir a Agenda).
              </div>
            </div>

            {canCreate ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-950 hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                Crear
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Vista Mes */}
      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            <div className="text-sm font-extrabold capitalize">
              {monthCursor ? fmtMonth(monthCursor) : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => monthCursor && setMonthCursor(addMonths(monthCursor, -1))}
              className="rounded-2xl border border-slate-200 bg-white p-2 hover:bg-slate-50"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => monthCursor && setMonthCursor(addMonths(monthCursor, 1))}
              className="rounded-2xl border border-slate-200 bg-white p-2 hover:bg-slate-50"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2 text-[11px] font-bold text-slate-500">
          {['L','M','X','J','V','S','D'].map((d) => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {grid.map((d) => {
            const k = ymd(d);
            const inMonth = monthCursor ? d.getMonth() === monthCursor.getMonth() : true;
            const count = (eventsByDay.get(k) ?? []).length;
            const selected = selectedDay === k;

            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedDay(k)}
                className={
                  "relative flex h-11 items-center justify-center rounded-2xl border text-sm font-extrabold " +
                  (selected
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : count > 0
                      ? "border-indigo-200 bg-indigo-50 text-slate-900 hover:bg-indigo-100"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50") +
                  (inMonth ? "" : " opacity-40")
                }
              >
                {d.getDate()}
                {count > 0 ? (
                  <span
                    className={
                      "absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full " +
                      (selected ? "bg-white" : "bg-indigo-600")
                    }
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {canCreate ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-900"
            >
              <Plus className="h-4 w-4" />
              Crear evento en este mes
            </button>
          </div>
        ) : null}
      </section>

      {/* Eventos del día */}
      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold">Eventos del día</div>
            <div className="mt-1 text-xs text-slate-500 capitalize">
              {selectedEvents[0]?.starts_at ? fmtDayLabel(selectedEvents[0].starts_at) : (selectedDay ? selectedDay : "")}
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {selectedEvents.length} evento{selectedEvents.length === 1 ? "" : "s"}
          </span>
        </div>

        {selectedEvents.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No hay eventos para este día.
            {canCreate ? (
              <button
                type="button"
                onClick={openCreate}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-500"
              >
                <Plus className="h-4 w-4" />
                Crear evento
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {selectedEvents.map((e) => {
              const cur = rsvps?.[String(e.id)];
              const tone = toneFromStatus(e.status);

              return (
                <div
                  key={e.id}
                  className={
                    "rounded-3xl border border-slate-200 p-4 " +
                    (e.status === "cancelled" ? "bg-rose-50" : "bg-white")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold truncate">{clip(e.title, 80)}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-700">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-800">
                          <Clock3 className="h-3.5 w-3.5" />
                          {fmtTime(e.starts_at)}
                        </span>
                        {e.place ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-800">
                            <MapPin className="h-3.5 w-3.5" />
                            {clip(e.place, 40)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className={`${pillBase} ${tone.pill}`}>{tone.label}</span>
                  </div>

                  <form action={calendarRsvpAction} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="groupId" value={groupId} />
                    <input type="hidden" name="eventId" value={String(e.id)} />

                    <button
                      type="submit"
                      name="rsvp"
                      value="yes"
                      onClick={() => setRsvps((p) => ({ ...p, [String(e.id)]: "yes" }))}
                      className={`${pillBase} ${cur === "yes" ? yesOn : off}`}
                    >
                      Voy
                    </button>

                    <button
                      type="submit"
                      name="rsvp"
                      value="maybe"
                      onClick={() => setRsvps((p) => ({ ...p, [String(e.id)]: "maybe" }))}
                      className={`${pillBase} ${cur === "maybe" ? maybeOn : off}`}
                    >
                      Quizá
                    </button>

                    <button
                      type="submit"
                      name="rsvp"
                      value="no"
                      onClick={() => setRsvps((p) => ({ ...p, [String(e.id)]: "no" }))}
                      className={`${pillBase} ${cur === "no" ? noOn : off}`}
                    >
                      No voy
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Próximos */}
      <details className="mt-4 rounded-3xl border border-slate-200 bg-white p-4" open={upcoming.length <= 6}>
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold">Próximos eventos</div>
              <div className="mt-1 text-xs text-slate-500">Lista rápida (ordenada por fecha).</div>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {upcoming.length}
            </span>
          </div>
        </summary>

        {upcoming.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No hay eventos próximos.
            {canCreate ? (
              <button
                type="button"
                onClick={openCreate}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-900"
              >
                <Plus className="h-4 w-4" />
                Crear el primer evento
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {upcoming.slice(0, 30).map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelectedDay(dayKey(e.starts_at))}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold truncate">{clip(e.title, 60)}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {fmtDayLabel(e.starts_at)} · {fmtTime(e.starts_at)}{e.place ? ` · ${clip(e.place, 30)}` : ""}
                    </div>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    Ver
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </details>

      {/* FAB crear */}
      {canCreate ? (
        <button
          type="button"
          onClick={openCreate}
          className="fixed bottom-24 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 md:hidden"
          aria-label="Crear evento"
        >
          <Plus className="h-6 w-6" />
        </button>
      ) : null}

      {/* Modal crear */}
      {open ? (
        <div className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => (pending ? null : setOpen(false))}
          />

          <div className="relative w-full max-w-lg rounded-t-3xl bg-white p-4 shadow-2xl sm:rounded-3xl max-h-[85dvh] overflow-y-auto overscroll-contain pb-[calc(6rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold">Crear evento</div>
                <div className="mt-1 text-xs text-slate-500">Se añadirá al calendario del grupo.</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-2xl border border-slate-200 bg-white p-2 hover:bg-slate-50 disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <label className="block">
                <div className="text-xs font-bold text-slate-700">Título</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Partido padel"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <div className="text-xs font-bold text-slate-700">Fecha</div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-bold text-slate-700">Hora</div>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
                  />
                </label>
              </div>

              <label className="block">
                <div className="text-xs font-bold text-slate-700">Lugar (opcional)</div>
                <input
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="Ej: Pistas del Junquillo"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block">
                <div className="text-xs font-bold text-slate-700">Notas (opcional)</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Info extra, reglas, etc."
                  rows={3}
                  className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
                />
              </label>

              {err ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {err}
                </div>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="w-1/3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitCreate}
                  disabled={pending}
                  className="w-2/3 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {pending ? "Creando…" : "Crear evento"}
                </button>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-500">
              Tip: si no tienes permisos, revisa que seas miembro del grupo.
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

