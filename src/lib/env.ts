function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(
      `[ENV] Falta ${name}. Revisa Vercel → Settings → Environment Variables (Production/Preview/Development).`
    );
  }
  return v.trim();
}

export function getSupabaseEnv() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url.startsWith("https://")) {
    throw new Error(`[ENV] NEXT_PUBLIC_SUPABASE_URL inválida. Debe empezar por https://. Got: ${url}`);
  }
  if (anonKey.length < 80) {
    throw new Error(
      `[ENV] NEXT_PUBLIC_SUPABASE_ANON_KEY parece demasiado corta (${anonKey.length}). Probable key mal pegada/truncada.`
    );
  }

  return { url, anonKey };
}
