import test from "node:test";
import assert from "node:assert/strict";
import { allocateFulfillment } from "../src/fulfillment-allocation.js";

test("allocates each line to the first warehouse that can fulfill it", () => {
  const allocations = allocateFulfillment(
    [
      { id: "line-1", sku: "KEYBOARD", quantity: 2 },
      { id: "line-2", sku: "USB-CABLE", quantity: 4 },
    ],
    {
      west: { KEYBOARD: 3, "USB-CABLE": 1 },
      east: { KEYBOARD: 5, "USB-CABLE": 10 },
    },
    ["west", "east"],
  );

  assert.deepEqual(allocations, [
    { lineId: "line-1", sku: "KEYBOARD", warehouse: "west", quantity: 2 },
    { lineId: "line-2", sku: "USB-CABLE", warehouse: "east", quantity: 4 },
  ]);
});

test("rejects orders when inventory is genuinely insufficient", () => {
  assert.throws(() => allocateFulfillment(
    [{ id: "line-1", sku: "KEYBOARD", quantity: 4 }],
    { west: { KEYBOARD: 2 }, east: { KEYBOARD: 1 } },
    ["west", "east"],
  ), /insufficient stock/);
});
