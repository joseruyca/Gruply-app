"use client";

export default function ModeToggle({
  mode,
  setMode,
}: {
  mode: "signin" | "signup";
  setMode: (m: "signin" | "signup") => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      className="text-sm font-extrabold text-slate-900 hover:underline"
    >
      {mode === "signin" ? "Crear cuenta" : "Ya tengo cuenta"}
    </button>
  );
}
