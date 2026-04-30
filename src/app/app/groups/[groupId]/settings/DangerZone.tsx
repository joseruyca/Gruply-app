"use client";

import * as React from "react";

type ActionFn = (formData: FormData) => Promise<void>;

export default function DangerZone(props: {
  groupId: string;
  canLeave: boolean;
  canDelete: boolean;
  leaveAction: ActionFn;
  deleteAction: ActionFn;
}) {
  const { groupId, canLeave, canDelete, leaveAction, deleteAction } = props;

  const confirmLeave = React.useCallback((e: React.FormEvent) => {
    if (!window.confirm("¿Seguro que quieres salir del grupo?")) {
      e.preventDefault();
    }
  }, []);

  const confirmDelete = React.useCallback((e: React.FormEvent) => {
    if (
      !window.confirm(
        "Vas a ELIMINAR el grupo (y todo lo relacionado). ¿Continuar?"
      )
    ) {
      e.preventDefault();
    }
  }, []);

  return (
    <section className="mt-6 rounded-2xl border border-red-200 bg-white p-4">
      <div className="text-sm font-semibold text-red-700">Zona de riesgo</div>
      <p className="mt-1 text-sm text-slate-600">
        Acciones permanentes. Úsalas con cuidado.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <form
          action={leaveAction}
          onSubmit={confirmLeave}
          className="flex items-center justify-between gap-3"
        >
          <input type="hidden" name="group_id" value={groupId} />
          <div className="min-w-0">
            <div className="text-sm font-medium">Salir del grupo</div>
            <div className="text-xs text-slate-500">
              Dejarás de ver el contenido de este grupo.
            </div>
          </div>
          <button
            type="submit"
            disabled={!canLeave}
            className={
              "rounded-xl px-3 py-2 text-sm font-semibold " +
              (canLeave
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "cursor-not-allowed bg-slate-100 text-slate-400")
            }
            title={
              canLeave
                ? ""
                : "Eres el único admin. Asigna otro admin antes de salir."
            }
          >
            Salir
          </button>
        </form>

        <form
          action={deleteAction}
          onSubmit={confirmDelete}
          className="flex items-center justify-between gap-3"
        >
          <input type="hidden" name="group_id" value={groupId} />
          <div className="min-w-0">
            <div className="text-sm font-medium">Eliminar grupo</div>
            <div className="text-xs text-slate-500">
              Solo admins. Acción irreversible.
            </div>
          </div>
          <button
            type="submit"
            disabled={!canDelete}
            className={
              "rounded-xl px-3 py-2 text-sm font-semibold " +
              (canDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400")
            }
          >
            Eliminar
          </button>
        </form>
      </div>
    </section>
  );
}