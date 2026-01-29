import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const type = url.searchParams.get("type") ?? undefined; // "recovery" | "signup" | etc.
  const token_hash = url.searchParams.get("token_hash") ?? undefined;
  const code = url.searchParams.get("code") ?? undefined;

  // destino final
  const dest = type === "recovery" ? "/reset-password" : "/app/groups";
  let response = NextResponse.redirect(new URL(dest, url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 1) Flujo por token_hash (email verify / recovery)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type: type as any, token_hash });
    if (error) return NextResponse.redirect(new URL(`/error?m=${encodeURIComponent(error.message)}`, url));
    return response;
  }

  // 2) Flujo PKCE por code (OAuth / magic links)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL(`/error?m=${encodeURIComponent(error.message)}`, url));
    return response;
  }

  return NextResponse.redirect(new URL("/login?e=missing_params", url));
}