import { NextResponse } from "next/server";
import { getProfile, requireUser } from "@/lib/account";
import { getStripe } from "@/lib/stripe";

/** Starts a Stripe Checkout for the one-time Pro pass. */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  if (!process.env.STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const profile = await getProfile(auth.user.id);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    client_reference_id: auth.user.id,
    metadata: { user_id: auth.user.id },
    ...(profile?.stripe_customer_id
      ? { customer: profile.stripe_customer_id }
      : { customer_email: auth.user.email, customer_creation: "always" as const }),
    success_url: `${origin}/pricing?status=success`,
    cancel_url: `${origin}/pricing?status=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
