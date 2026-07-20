import Stripe from "stripe";
import { env, isStripeEnabled } from "./env.js";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeEnabled) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing).");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}
