import test from "node:test";
import assert from "node:assert/strict";
import { projectOrder } from "../src/order-events.js";

test("projects a paid, shipped, partially refunded order", () => {
  const order = projectOrder([
    { id: "evt-create", type: "order.created", data: { orderId: "order-42", totalCents: 10_000 } },
    { id: "evt-pay", type: "payment.captured", data: { amountCents: 10_000 } },
    {
      id: "evt-ship",
      type: "fulfillment.shipped",
      data: { shipmentId: "shipment-west", trackingNumber: "TRACK-123" },
    },
    { id: "evt-refund", type: "refund.issued", data: { amountCents: 1_600 } },
  ]);

  assert.equal(order.orderId, "order-42");
  assert.equal(order.capturedCents, 10_000);
  assert.equal(order.refundedCents, 1_600);
  assert.equal(order.status, "partially_refunded");
  assert.deepEqual(order.shipments, [
    { shipmentId: "shipment-west", trackingNumber: "TRACK-123" },
  ]);
});

test("rejects malformed and unsupported events", () => {
  assert.throws(() => projectOrder([{ type: "order.created", data: {} }]), /non-empty id/);
  assert.throws(
    () => projectOrder([{ id: "evt-unknown", type: "inventory.changed", data: {} }]),
    /unsupported order event/,
  );
});

test("ignores identical event re-deliveries and rejects conflicting duplicates", () => {
  const created = {
    id: "evt-create",
    type: "order.created",
    data: { orderId: "order-42", totalCents: 10_000 },
  };
  const paid = { id: "evt-pay", type: "payment.captured", data: { amountCents: 10_000 } };
  const shipped = {
    id: "evt-ship",
    type: "fulfillment.shipped",
    data: { shipmentId: "shipment-west", trackingNumber: "TRACK-123" },
  };
  const refunded = { id: "evt-refund", type: "refund.issued", data: { amountCents: 1_600 } };

  const order = projectOrder([
    created,
    paid,
    shipped,
    refunded,
    { ...shipped },
    { ...refunded },
  ]);

  assert.equal(order.refundedCents, 1_600);
  assert.equal(order.status, "partially_refunded");
  assert.deepEqual(order.shipments, [
    { shipmentId: "shipment-west", trackingNumber: "TRACK-123" },
  ]);

  assert.throws(
    () =>
      projectOrder([
        created,
        paid,
        shipped,
        { id: "evt-ship", type: "refund.issued", data: { amountCents: 1_600 } },
      ]),
    /conflict/i,
  );

  const secondShipment = {
    id: "evt-ship-2",
    type: "fulfillment.shipped",
    data: { shipmentId: "shipment-west", trackingNumber: "TRACK-123" },
  };
  const withDistinctId = projectOrder([created, paid, shipped, secondShipment]);
  assert.equal(withDistinctId.shipments.length, 2);
});
