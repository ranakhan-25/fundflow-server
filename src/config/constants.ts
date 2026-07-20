export const ROLES = {
  SUPPORTER: "supporter",
  CREATOR: "creator",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Credits granted once, on first profile creation.
export const SIGNUP_CREDITS: Record<string, number> = {
  [ROLES.SUPPORTER]: 50,
  [ROLES.CREATOR]: 20,
  [ROLES.ADMIN]: 0,
};

// Business logic for the platform's earning model.
// Supporters buy 10 credits for $1; creators withdraw $1 for every 20 credits.
export const CREDITS_PER_DOLLAR_PURCHASE = 10;
export const CREDITS_PER_DOLLAR_WITHDRAW = 20;
export const MIN_WITHDRAW_CREDITS = 200;

// Fixed credit packages available on the "Purchase Credit" route.
export const CREDIT_PACKAGES = [
  { id: "pkg_100", credits: 100, priceUsd: 10 },
  { id: "pkg_300", credits: 300, priceUsd: 25 },
  { id: "pkg_800", credits: 800, priceUsd: 60 },
  { id: "pkg_1500", credits: 1500, priceUsd: 110 },
] as const;

export const CAMPAIGN_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
} as const;

export const CONTRIBUTION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const WITHDRAWAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
} as const;

export const REPORT_STATUS = {
  OPEN: "open",
  RESOLVED: "resolved",
} as const;
