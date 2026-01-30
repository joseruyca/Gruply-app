import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/env";

export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();

  // Next moderno: cookies() es async
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        // cookieStore.getAll existe una vez await cookies()
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // En algunos contextos (Server Components) puede no permitir set;
          // en Route Handlers normalmente sí.
        }
      },
    },
  });
}
