import { getProduct } from "./catalog.js";

function validateQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 25) {
    throw new RangeError("quantity must be an integer between 1 and 25");
  }
}

export function normalizeCart(rawLines) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new TypeError("cart must contain at least one line");
  }

  const merged = new Map();
  for (const rawLine of rawLines) {
    validateQuantity(rawLine.quantity);
    const product = getProduct(rawLine.sku);
    const key = `${product.sku}:${product.warehouse}`;
    const previous = merged.get(key);
    const quantity = (previous?.quantity ?? 0) + rawLine.quantity;
    validateQuantity(quantity);
    merged.set(key, {
      ...product,
      quantity,
      grossCents: product.unitPriceCents * quantity,
    });
  }

  return [...merged.values()].sort((a, b) => a.sku.localeCompare(b.sku));
}

export function merchandiseSubtotal(lines) {
  return lines.reduce((total, line) => total + line.grossCents, 0);
}
