/**
 * Pure planning calculations. These figures are advisory and do not freeze wallet funds.
 * The independent Soroban vault contract implements future enforceable policy.
 */
export type Commitment = {
  id: string;
  label: string;
  amount: number;
  due: string;
  recipient?: string;
  createdAt: string;
};

export type SafetyAssessment = {
  reserved: number;
  networkHold: number;
  spendable: number;
  safeToPay: number;
  status: "covered" | "tight" | "at-risk" | "unfunded";
  reason: string;
};

export function round7(n: number): number {
  return Math.round((n + Number.EPSILON) * 10_000_000) / 10_000_000;
}

export function assessSafety(balance: number, commitments: Pick<Commitment, "amount">[], networkHold = 2): SafetyAssessment {
  if (!Number.isFinite(balance) || balance < 0 || !Number.isFinite(networkHold) || networkHold < 0) {
    throw new Error("Invalid balance or network hold");
  }
  const reserved = round7(commitments.reduce((sum, c) => {
    if (!Number.isFinite(c.amount) || c.amount <= 0) throw new Error("Commitment amounts must be positive");
    return sum + c.amount;
  }, 0));
  const spendable = round7(Math.max(0, balance - networkHold));
  const safeToPay = round7(Math.max(0, spendable - reserved));
  const status = balance === 0 ? "unfunded" : spendable < reserved ? "at-risk" : (spendable - reserved < Math.max(1, reserved * 0.1)) ? "tight" : "covered";
  const reason = balance === 0
    ? "Connect and fund a Testnet wallet to calculate available funds."
    : status === "at-risk" ? "Your planned commitments exceed the funds available after the network hold."
    : status === "tight" ? "Your obligations are covered, but your remaining buffer is narrow."
    : "Your planned commitments are covered by your available balance.";
  return { reserved, networkHold, spendable, safeToPay, status, reason };
}

export function canPlanPayment(payment: number, safety: SafetyAssessment): boolean {
  return Number.isFinite(payment) && payment > 0 && round7(payment) <= safety.safeToPay;
}

export function normalizeAmount(input: string): number | null {
  if (!/^\d+(?:\.\d{1,7})?$/.test(input.trim())) return null;
  const n = Number(input);
  return Number.isFinite(n) && n > 0 ? n : null;
}
