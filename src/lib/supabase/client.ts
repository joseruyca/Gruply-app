import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/env";

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  if (!url || !anonKey) {
    throw new Error(
      "[ENV][client] No llegan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Reinicia `npm run dev` y limpia cache (Application → Storage → Clear site data)."
    );
  }
  return createBrowserClient(url, anonKey);
}
