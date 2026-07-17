import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCart } from "../src/cart.js";

test("duplicate SKUs are merged before pricing", () => {
  const lines = normalizeCart([
    { sku: "USB-CABLE", quantity: 1 },
    { sku: "USB-CABLE", quantity: 2 },
  ]);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].quantity, 3);
  assert.equal(lines[0].grossCents, 6_000);
});

test("invalid quantities are rejected", () => {
  assert.throws(() => normalizeCart([{ sku: "USB-CABLE", quantity: 0 }]), /quantity/);
});
