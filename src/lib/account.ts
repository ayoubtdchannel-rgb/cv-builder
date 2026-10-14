import "server-only";
import { NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import type { Usage } from "@/lib/ai";

export type UsageKind = "interview" | "document" | "generate";

// Rolling 24-hour caps per user. They keep AI spend bounded; Pro raises them.
const DAILY_LIMITS: Record<"free" | "pro", Record<UsageKind, number>> = {
  free: { interview: 60, document: 10, generate: 3 },
  pro: { interview: 400, document: 60, generate: 30 },
};

export function isPro(proUntil: string | null | undefined) {
  return Boolean(proUntil && new Date(proUntil).getTime() > Date.now());
}

/** Resolves the signed-in user for a route handler, or a 401 response. */
export async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) } as const;
  }
  return { supabase, user: data.user } as const;
}

export async function getProfile(userId: string) {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("id, email, full_name, pro_until, stripe_customer_id")
    .eq("id", userId)
    .single();
  return data;
}

/** Returns a 429 response when the user is over today's cap for `kind`. */
export async function checkQuota(userId: string, kind: UsageKind) {
  const admin = createSupabaseAdmin();
  const profile = await getProfile(userId);
  const limit = DAILY_LIMITS[isPro(profile?.pro_until) ? "pro" : "free"][kind];
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", since);

  if ((count ?? 0) >= limit) {
    const message = isPro(profile?.pro_until)
      ? "You've reached today's limit. Please try again tomorrow."
      : "You've reached the free daily limit. Upgrade to Pro for more, or try again tomorrow.";
    return NextResponse.json({ error: message }, { status: 429 });
  }
  return null;
}

export async function recordUsage(userId: string, kind: UsageKind, usage: Usage) {
  await createSupabaseAdmin().from("ai_usage").insert({
    user_id: userId,
    kind,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
  });
}
