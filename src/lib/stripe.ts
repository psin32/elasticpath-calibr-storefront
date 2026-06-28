import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const accountId = process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID;

export const stripePromise = loadStripe(
  publishableKey,
  accountId ? { stripeAccount: accountId } : undefined,
);

/**
 * When NEXT_PUBLIC_STRIPE_ACCOUNT_ID is set the storefront is configured for
 * Elastic Path Payments (EP-managed Stripe connected account).
 * Without it, fall back to the merchant's own Stripe via EP's standard gateway.
 */
export const STRIPE_GATEWAY = accountId
  ? ("elastic_path_payments_stripe" as const)
  : ("stripe_payment_intents" as const);
