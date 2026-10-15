import { NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";

const VARS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "ANTHROPIC_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID",
] as const;

/**
 * Setup check: open /api/health while signed in. Reports which settings are
 * missing or malformed and whether the database accepts reads and writes.
 * Never returns secret values.
 */
export async function GET() {
  const env = Object.fromEntries(
    VARS.map((name) => {
      const value = process.env[name];
      if (!value) return [name, "missing"];
      if (value !== value.trim()) return [name, "has extra spaces or a line break - re-enter it"];
      return [name, "ok"];
    }),
  );

  const checks: Record<string, string> = {};
  const supabase = await createSupabaseServer();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  checks.signedIn = auth.user ? `yes (${auth.user.email})` : `no${authError ? ` - ${authError.message}` : ""}`;

  if (auth.user) {
    const read = await supabase.from("cvs").select("id").limit(1);
    checks.readCvs = read.error ? `FAILED - ${read.error.message}` : "ok";

    const write = await supabase.from("cvs").insert({ user_id: auth.user.id, title: "health check" }).select("id").single();
    if (write.error) {
      checks.createCv = `FAILED - ${write.error.message}`;
    } else {
      checks.createCv = "ok";
      await supabase.from("cvs").delete().eq("id", write.data.id);
    }

    if (process.env.SUPABASE_SECRET_KEY) {
      const admin = await createSupabaseAdmin().from("profiles").select("id").eq("id", auth.user.id).maybeSingle();
      checks.secretKey = admin.error ? `FAILED - ${admin.error.message}` : admin.data ? "ok" : "ok (but your profile row is missing)";
    }
  }

  return NextResponse.json({ env, checks }, { headers: { "Cache-Control": "no-store" } });
}
