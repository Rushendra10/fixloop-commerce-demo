import test from "node:test";
import assert from "node:assert/strict";
import { checkout } from "../src/checkout.js";
import { calculateRefund } from "../src/returns.js";

test("a complete order return includes outbound paid shipping", () => {
  const order = checkout(
    {
      lines: [{ sku: "USB-CABLE", quantity: 1 }],
      couponCode: "WELCOME10",
      destination: { state: "OR", postalCode: "97205" },
    },
    { freeShippingThresholdCents: 6_000 },
  );
  const refund = calculateRefund(order, [{ sku: "USB-CABLE", quantity: 1 }]);
  assert.equal(refund.merchandiseCents, 1_800);
  assert.equal(refund.taxCents, 0);
  assert.equal(refund.shippingCents, order.shippingCents);
  assert.equal(refund.totalCents, order.totalCents);
});

test("return quantities cannot exceed the original purchase", () => {
  const order = checkout({
    lines: [{ sku: "USB-CABLE", quantity: 1 }],
    destination: { state: "OR", postalCode: "97205" },
  });
  assert.throws(
    () => calculateRefund(order, [{ sku: "USB-CABLE", quantity: 2 }]),
    /more than purchased/,
  );
});
