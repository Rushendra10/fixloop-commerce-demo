import test from "node:test";
import assert from "node:assert/strict";
import { redeemPoints } from "../src/loyalty-ledger.js";

test("redeems points from an available lot", () => {
  const result = redeemPoints(
    [{ id: "welcome", points: 500, earnedAt: "2026-01-01", expiresAt: "2027-01-01" }],
    200,
    "2026-07-17",
  );
  assert.deepEqual(result.allocations, [{ lotId: "welcome", points: 200 }]);
});

test("expired lots are excluded from available balance", () => {
  const lots = [
    { id: "expired", points: 800, earnedAt: "2025-01-01", expiresAt: "2026-01-01" },
    { id: "active", points: 300, earnedAt: "2026-06-01", expiresAt: "2027-01-01" },
  ];
  assert.throws(() => redeemPoints(lots, 400, "2026-07-17"), /300 available/);
});

test("redemption can span multiple lots", () => {
  const lots = [
    { id: "lot-a", points: 100, earnedAt: "2026-01-01", expiresAt: "2027-01-01" },
    { id: "lot-b", points: 200, earnedAt: "2026-02-01", expiresAt: "2027-02-01" },
  ];
  const result = redeemPoints(lots, 250, "2026-07-17");
  assert.equal(result.allocations.reduce((sum, item) => sum + item.points, 0), 250);
});
