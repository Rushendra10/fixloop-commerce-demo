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

test("paginates orders that share createdAt without gaps or duplicates", () => {
  const createdAt = "2026-07-17T15:00:00Z";
  const orders = ["ord-a", "ord-b", "ord-c", "ord-d", "ord-e", "ord-f"].map((id) => ({
    id,
    createdAt,
  }));

  const seen = [];
  let after = null;
  let pages = 0;

  do {
    const page = paginateOrders(orders, { limit: 2, after });
    pages += 1;
    assert.ok(page.items.length > 0);
    for (const item of page.items) {
      seen.push(item.id);
    }
    after = page.nextCursor;
  } while (after);

  assert.equal(pages, 3);
  assert.equal(seen.length, orders.length);
  assert.equal(new Set(seen).size, seen.length);
  assert.deepEqual([...seen].sort(), orders.map((order) => order.id).sort());
});
