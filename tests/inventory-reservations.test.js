import test from "node:test";
import assert from "node:assert/strict";
import { calculateAvailability } from "../src/inventory-reservations.js";

test("active reservations reduce available stock", () => {
  const availability = calculateAvailability(
    { west: { "LAMP-PRO": 10, "USB-CABLE": 20 } },
    [
      {
        id: "reserve-1",
        warehouse: "west",
        sku: "LAMP-PRO",
        quantity: 3,
        expiresAt: "2026-07-17T18:30:00Z",
      },
    ],
    "2026-07-17T18:00:00Z",
  );
  assert.deepEqual(availability, { west: { "LAMP-PRO": 7, "USB-CABLE": 20 } });
});

test("expired reservations no longer hold stock", () => {
  const availability = calculateAvailability(
    { west: { "LAMP-PRO": 10 } },
    [
      {
        id: "reserve-expired",
        warehouse: "west",
        sku: "LAMP-PRO",
        quantity: 4,
        expiresAt: "2026-07-17T17:59:59Z",
      },
    ],
    "2026-07-17T18:00:00Z",
  );
  assert.equal(availability.west["LAMP-PRO"], 10);
});

test("availability never becomes negative", () => {
  const availability = calculateAvailability(
    { west: { "USB-CABLE": 2 } },
    [
      {
        id: "reserve-large",
        warehouse: "west",
        sku: "USB-CABLE",
        quantity: 5,
        expiresAt: "2026-07-17T19:00:00Z",
      },
    ],
    "2026-07-17T18:00:00Z",
  );
  assert.equal(availability.west["USB-CABLE"], 0);
});
