import test from "node:test";
import assert from "node:assert/strict";
import { resolveShippingZone } from "../src/shipping-zones.js";

const ZONES = [
  { id: "west", prefixes: ["8", "9"], baseRateCents: 700 },
  { id: "east", prefixes: ["0", "1", "2"], baseRateCents: 650 },
];

test("resolves a postal code to its configured zone", () => {
  assert.deepEqual(resolveShippingZone("97205", ZONES), {
    zoneId: "west",
    postalCode: "97205",
    baseRateCents: 700,
  });
  assert.equal(resolveShippingZone("10001", ZONES).zoneId, "east");
});

test("normalizes whitespace and case", () => {
  const zones = [{ id: "canada", prefixes: ["M5V"], baseRateCents: 1_200 }];
  assert.equal(resolveShippingZone("m5v 3a8", zones).postalCode, "M5V3A8");
});

test("rejects postal codes without a matching zone", () => {
  assert.throws(() => resolveShippingZone("50001", ZONES), /no shipping zone/);
});
