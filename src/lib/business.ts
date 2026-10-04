// Business facts the owner has NOT confirmed yet (DESIGN.md amendment 7).
//
// Every value is null until she confirms it. UI rule: render a fact only when
// it is non-null; never substitute a guess, a range or "à partir de …".
// When she answers (06 §6 questions 1–3), fill the value here and nowhere else.

import type { Locale } from "./db-types";

/** Minimum days of notice for a custom cake. */
// OWNER: confirm (standard / themed kids' / wedding may differ)
export const LEAD_TIME_DAYS: number | null = null;

/** Lowest price she is willing to publish, in DZD. */
// OWNER: confirm (and whether she wants prices public at all)
export const PRICE_FROM: { amountDzd: number } | null = null;

/** Delivery policy: zones in words per locale, fee in DZD (null = ask). */
// OWNER: confirm
export const DELIVERY: { zones: Record<Locale, string>; feeDzd: number | null } | null = null;

/** Accepted payment methods. */
// OWNER: confirm
export const PAYMENT: ReadonlyArray<"cash" | "baridimob" | "ccp"> | null = null;

/** Deposit asked when ordering, as a percentage of the price. */
// OWNER: confirm
export const DEPOSIT: { percent: number } | null = null;
