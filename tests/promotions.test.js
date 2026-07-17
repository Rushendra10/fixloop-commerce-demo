import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCart } from "../src/cart.js";
import { applyCoupon } from "../src/promotions.js";

test("coupon allocations add up exactly after cent rounding", () => {
  const lines = normalizeCart([
    { sku: "LAMP-PRO", quantity: 1 },
    { sku: "USB-CABLE", quantity: 1 },
    { sku: "KEYBOARD", quantity: 1 },
  ]);
  const result = applyCoupon(lines, "WELCOME10");
  assert.equal(result.discountCents, 1_450);
  assert.equal(result.lines.reduce((sum, line) => sum + line.discountCents, 0), 1_450);
});
