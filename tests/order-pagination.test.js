import test from "node:test";
import assert from "node:assert/strict";
import { paginateOrders } from "../src/order-pagination.js";

const ORDERS = [
  { id: "order-3", createdAt: "2026-07-17T12:03:00Z" },
  { id: "order-2", createdAt: "2026-07-17T12:02:00Z" },
  { id: "order-1", createdAt: "2026-07-17T12:01:00Z" },
];

test("paginates orders newest first", () => {
  const first = paginateOrders(ORDERS, { limit: 2 });
  assert.deepEqual(first.items.map((order) => order.id), ["order-3", "order-2"]);
  assert.ok(first.nextCursor);

  const second = paginateOrders(ORDERS, { limit: 2, after: first.nextCursor });
  assert.deepEqual(second.items.map((order) => order.id), ["order-1"]);
  assert.equal(second.nextCursor, null);
});

test("validates page size and cursor", () => {
  assert.throws(() => paginateOrders(ORDERS, { limit: 0 }), /limit/);
  assert.throws(() => paginateOrders(ORDERS, { after: "not-a-cursor" }), /invalid order cursor/);
});
