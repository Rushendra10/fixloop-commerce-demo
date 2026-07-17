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

test("free-shipping threshold is evaluated per fulfillment group after discounts", () => {
  const order = checkout(
    {
      lines: [
        { sku: "LAMP-PRO", quantity: 2 },
        { sku: "USB-CABLE", quantity: 1 },
      ],
      couponCode: "VIP20",
      destination: { state: "CA", postalCode: "94107" },
    },
    { freeShippingThresholdCents: 6_000 },
  );

  assert.equal(order.coupon, "VIP20");
  assert.equal(order.subtotalCents, 10_000);
  assert.equal(order.discountCents, 2_000);
  assert.equal(order.taxCents, 580);

  const lamp = order.lines.find((line) => line.sku === "LAMP-PRO");
  const cable = order.lines.find((line) => line.sku === "USB-CABLE");
  assert.equal(lamp.discountCents, 1_600);
  assert.equal(lamp.netCents, 6_400);
  assert.equal(lamp.taxCents, 464);
  assert.equal(cable.discountCents, 400);
  assert.equal(cable.netCents, 1_600);
  assert.equal(cable.taxCents, 116);

  assert.equal(order.shipments.length, 2);
  assert.deepEqual(
    order.shipments.map((shipment) => shipment.warehouse),
    ["west", "east"],
  );

  const [west, east] = order.shipments;
  assert.equal(west.merchandiseCents, 6_400);
  assert.equal(west.freeShipping, true);
  assert.equal(west.shippingCents, 0);

  assert.equal(east.merchandiseCents, 1_600);
  assert.equal(east.freeShipping, false);
  assert.equal(east.shippingCents, 750);

  assert.equal(order.shippingCents, 750);
  assert.equal(order.totalCents, 9_330);
});
