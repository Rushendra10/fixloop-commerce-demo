import test from "node:test";
import assert from "node:assert/strict";
import { pricePromotionStack } from "../src/promotion-stack.js";

test("combines a percentage promotion with fixed credits", () => {
  assert.deepEqual(pricePromotionStack({
    subtotalCents: 10_000,
    percentageBasisPoints: 1_000,
    fixedCreditsCents: [500, 250],
  }), {
    subtotalCents: 10_000,
    percentageDiscountCents: 1_000,
    fixedCreditCents: 750,
    maximumDiscountCents: 5_000,
    discountCents: 1_750,
    totalCents: 8_250,
  });
});

test("validates monetary and basis-point inputs", () => {
  assert.throws(() => pricePromotionStack({ subtotalCents: -1 }), /subtotalCents/);
  assert.throws(() => pricePromotionStack({
    subtotalCents: 1_000,
    percentageBasisPoints: 10_001,
  }), /basis points/);
});
