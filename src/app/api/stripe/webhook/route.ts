import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { PRO_DAYS } from "@/lib/brand";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Stripe webhook: on a paid checkout, records the payment and extends Pro by
 * PRO_DAYS. Recording the session id first makes retried deliveries no-ops.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? "",
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const userId = session.client_reference_id ?? session.metadata?.user_id;
    if (session.payment_status !== "paid" || !userId) return NextResponse.json({ received: true });

    const admin = createSupabaseAdmin();
    const { error: insertError } = await admin.from("payments").insert({
      user_id: userId,
      stripe_session_id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
    });
    if (insertError) {
      // 23505 = unique violation: this session was already processed.
      if (insertError.code === "23505") return NextResponse.json({ received: true });
      console.error("payment insert failed", insertError);
      return NextResponse.json({ error: "Database error." }, { status: 500 });
    }

    const { data: profile } = await admin.from("profiles").select("pro_until").eq("id", userId).single();
    const current = profile?.pro_until ? new Date(profile.pro_until).getTime() : 0;
    const start = Math.max(current, Date.now());
    const proUntil = new Date(start + PRO_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;

    const { error } = await admin
      .from("profiles")
      .update({ pro_until: proUntil, ...(customer ? { stripe_customer_id: customer } : {}) })
      .eq("id", userId);
    if (error) {
      // Let Stripe retry: remove the payment row so the retry isn't skipped.
      await admin.from("payments").delete().eq("stripe_session_id", session.id);
      console.error("pro activation failed", error);
      return NextResponse.json({ error: "Database error." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
