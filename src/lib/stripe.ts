import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Created on first use so builds don't need the secret key. */
export function getStripe() {
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}
