import test from "node:test";
import assert from "node:assert/strict";
import { checkout } from "../src/checkout.js";

test("checkout combines coupon, tax, and a single shipment", () => {
  const order = checkout({
    lines: [{ sku: "KEYBOARD", quantity: 1 }],
    couponCode: "WELCOME10",
    destination: { state: "CA", postalCode: "94107" },
  });
  assert.equal(order.subtotalCents, 8_500);
  assert.equal(order.discountCents, 850);
  assert.equal(order.taxCents, 555);
  assert.equal(order.shippingCents, 0);
  assert.equal(order.totalCents, 8_205);
});

test("gift cards are excluded from promotions and shipping", () => {
  const order = checkout({
    lines: [{ sku: "GIFT-25", quantity: 1 }],
    couponCode: "VIP20",
    destination: { state: "OR", postalCode: "97205" },
  });
  assert.equal(order.discountCents, 0);
  assert.equal(order.taxCents, 0);
  assert.equal(order.shippingCents, 0);
  assert.deepEqual(order.shipments, []);
});
