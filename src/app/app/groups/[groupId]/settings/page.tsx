import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Settings, Shield, Crown, Users } from "lucide-react";
import { getGroupOrNull } from "@/lib/group/detail";
import { deleteGroupAction, leaveGroupAction, updateGroupAction } from "./actions";

export default async function GroupSettingsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const supabase = await createClient();

  const group = await getGroupOrNull(groupId);
  if (!group) {
    return (
      <main className="min-h-[100dvh] bg-slate-950">
        <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-8">
          <Link className="text-sm font-semibold text-indigo-200 underline" href="/app/groups">
            {"←"} Volver
          </Link>
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-white/80 backdrop-blur">
            Grupo no encontrado.
          </div>
        </div>
      </main>
    );
  }

  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id ?? null;

  const membersQ = await supabase.from("group_members").select("*", { count: "exact", head: true }).eq("group_id", groupId);
  const membersCount = membersQ.error ? 0 : membersQ.count ?? 0;

  const roleQ = uid
    ? await supabase.from("group_members").select("role").eq("group_id", groupId).eq("user_id", uid).maybeSingle()
    : null;

  const myRole = (roleQ as any)?.data?.role ?? null;
  const isAdmin = myRole === "admin";

  return (
    <main className="min-h-[100dvh] bg-slate-950 bg-[radial-gradient(900px_circle_at_50%_-20%,rgba(99,102,241,0.35),transparent_55%)]">
      <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-8 animate-g-slideIn">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
          <div className="flex items-start justify-between gap-3">
            <Link
              className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white hover:bg-white/15"
              href={`/app/groups/${groupId}`}
              aria-label="Volver"
              title="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-100">
                <Settings className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-extrabold text-white">Ajustes</div>
                <div className="text-xs text-white/70 truncate">{group.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200">
                  <Crown className="h-4 w-4" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                  <Shield className="h-4 w-4" /> Miembro
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/80">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
              <Users className="h-4 w-4" />
              {membersCount} miembros
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
              {String((group as any).emoji ?? "👥")} {String((group as any).activity ?? "otro")}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {/* Información del grupo */}
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-base font-extrabold">Información del grupo</div>
            <div className="mt-1 text-xs text-slate-500">
              Cambia nombre, actividad, emoji o descripción. Solo admin puede editar.
            </div>

            <form action={updateGroupAction} className="mt-4 space-y-3">
              <input type="hidden" name="groupId" value={groupId} />

              <div>
                <label className="text-xs font-bold text-slate-600">Nombre</label>
                <input
                  name="name"
                  defaultValue={String((group as any).name ?? "")}
                  disabled={!isAdmin}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
                  maxLength={50}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Actividad</label>
                  <input
                    name="activity"
                    defaultValue={String((group as any).activity ?? "otro")}
                    disabled={!isAdmin}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">Emoji</label>
                  <input
                    name="emoji"
                    defaultValue={String((group as any).emoji ?? "👥")}
                    disabled={!isAdmin}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Descripción</label>
                <textarea
                  name="description"
                  defaultValue={String((group as any).description ?? "")}
                  disabled={!isAdmin}
                  className="mt-1 min-h-[88px] w-full resize-none rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
                  maxLength={140}
                />
              </div>

              <button
                type="submit"
                disabled={!isAdmin}
                className="mt-1 inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Guardar cambios
              </button>
            </form>
          </section>

          {/* Salir del grupo */}
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-base font-extrabold">Tu membresía</div>
            <div className="mt-1 text-xs text-slate-500">
              Si sales del grupo, perderás acceso al contenido. (Solo admin puede borrar el grupo.)
            </div>

            <form action={leaveGroupAction} className="mt-4">
              <input type="hidden" name="groupId" value={groupId} />
              <button
                type="submit"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
              >
                Salir del grupo
              </button>
            </form>
          </section>

          {/* Danger zone */}
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
            <div className="text-base font-extrabold text-rose-900">Zona de peligro</div>
            <div className="mt-1 text-xs text-rose-800/80">
              Esta acción es irreversible. Solo admin puede borrar el grupo.
            </div>

            <form action={deleteGroupAction} className="mt-4">
              <input type="hidden" name="groupId" value={groupId} />
              <button
                type="submit"
                disabled={!isAdmin}
                className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Borrar grupo
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
