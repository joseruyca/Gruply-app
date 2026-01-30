import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    hasUrl: !!url,
    urlStartsWithHttps: typeof url === "string" ? url.startsWith("https://") : false,
    urlValuePreview: typeof url === "string" ? url.slice(0, 20) : null,
    hasAnonKey: !!key,
    anonKeyLength: typeof key === "string" ? key.length : 0,
  });
}
