import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const accountId = process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID;

export const stripePromise = loadStripe(
  publishableKey,
  accountId ? { stripeAccount: accountId } : undefined
);
