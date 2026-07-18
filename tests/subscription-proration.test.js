import test from "node:test";
import assert from "node:assert/strict";
import { proratePlanChange } from "../src/subscription-proration.js";

test("prorates a plan change in a 30-day billing period", () => {
  const result = proratePlanChange({
    periodStart: "2026-04-01T00:00:00Z",
    periodEnd: "2026-05-01T00:00:00Z",
    changeAt: "2026-04-16T00:00:00Z",
    oldPlanCents: 3_000,
    newPlanCents: 6_000,
  });
  assert.equal(result.remainingDays, 15);
  assert.equal(result.unusedCreditCents, 1_500);
  assert.equal(result.newPlanChargeCents, 3_000);
  assert.equal(result.amountDueCents, 1_500);
});

test("prorates using actual period length in a non-leap February", () => {
  // Feb 1–Mar 1 2026 is 28 days; change at Feb 15 leaves exactly half remaining.
  const result = proratePlanChange({
    periodStart: "2026-02-01T00:00:00Z",
    periodEnd: "2026-03-01T00:00:00Z",
    changeAt: "2026-02-15T00:00:00Z",
    oldPlanCents: 3_000,
    newPlanCents: 6_000,
  });
  assert.equal(result.remainingDays, 14);
  assert.equal(result.unusedCreditCents, 1_500);
  assert.equal(result.newPlanChargeCents, 3_000);
  assert.equal(result.amountDueCents, 1_500);
});

test("rejects changes outside the billing period", () => {
  assert.throws(
    () => proratePlanChange({
      periodStart: "2026-04-01", periodEnd: "2026-05-01", changeAt: "2026-05-02",
      oldPlanCents: 3_000, newPlanCents: 6_000,
    }),
    /inside the billing period/,
  );
});
