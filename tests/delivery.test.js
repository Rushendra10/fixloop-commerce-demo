import test from "node:test";
import assert from "node:assert/strict";
import { estimateDelivery } from "../src/delivery.js";

test("orders before a UTC warehouse cutoff process the same business day", () => {
  const estimate = estimateDelivery({
    orderedAt: "2026-07-17T13:30:00.000Z",
    warehouseTimeZone: "UTC",
    cutoffHourLocal: 14,
    transitBusinessDays: 2,
  });
  assert.equal(estimate.beforeCutoff, true);
  assert.equal(estimate.processingDate, "2026-07-17");
  assert.equal(estimate.estimatedDeliveryDate, "2026-07-21");
});

test("orders after Friday cutoff begin processing Monday", () => {
  const estimate = estimateDelivery({
    orderedAt: "2026-07-17T15:30:00.000Z",
    warehouseTimeZone: "UTC",
    cutoffHourLocal: 14,
    transitBusinessDays: 2,
  });
  assert.equal(estimate.beforeCutoff, false);
  assert.equal(estimate.processingDate, "2026-07-20");
  assert.equal(estimate.estimatedDeliveryDate, "2026-07-22");
});

test("invalid cutoff and transit inputs are rejected", () => {
  assert.throws(
    () => estimateDelivery({ orderedAt: "2026-07-17T12:00:00Z", cutoffHourLocal: 24 }),
    /cutoffHourLocal/,
  );
  assert.throws(
    () => estimateDelivery({ orderedAt: "2026-07-17T12:00:00Z", transitBusinessDays: -1 }),
    /transitBusinessDays/,
  );
});
