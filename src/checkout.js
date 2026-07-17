import { normalizeCart, merchandiseSubtotal } from "./cart.js";
import { assertInventory } from "./inventory.js";
import { applyCoupon } from "./promotions.js";
import { quoteShipping } from "./shipping.js";
import { calculateTax } from "./tax.js";

function validateRequest(request) {
  if (!request || typeof request !== "object") throw new TypeError("checkout request is required");
  if (!request.destination) throw new TypeError("destination is required");
}

export function checkout(request, options = {}) {
  validateRequest(request);
  const normalized = normalizeCart(request.lines);
  assertInventory(normalized, options.stock);

  const promotion = applyCoupon(normalized, request.couponCode);
  const taxes = calculateTax(promotion.lines, request.destination);
  const shipping = quoteShipping(taxes.lines, {
    freeShippingThresholdCents: options.freeShippingThresholdCents,
  });

  const subtotalCents = merchandiseSubtotal(normalized);
  const totalCents = subtotalCents - promotion.discountCents + taxes.taxCents + shipping.shippingCents;
  return {
    currency: "USD",
    coupon: promotion.coupon,
    subtotalCents,
    discountCents: promotion.discountCents,
    taxCents: taxes.taxCents,
    shippingCents: shipping.shippingCents,
    totalCents,
    lines: taxes.lines,
    shipments: shipping.shipments,
  };
}
