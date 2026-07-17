function quantitiesBySku(returnedItems) {
  const quantities = new Map();
  for (const item of returnedItems) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new RangeError("return quantity must be a positive integer");
    }
    quantities.set(item.sku, (quantities.get(item.sku) ?? 0) + item.quantity);
  }
  return quantities;
}

export function calculateRefund(order, returnedItems) {
  if (!order?.lines || !Array.isArray(returnedItems) || returnedItems.length === 0) {
    throw new TypeError("order and returned items are required");
  }
  const requested = quantitiesBySku(returnedItems);
  const refundedLines = [];

  for (const [sku, quantity] of requested) {
    const line = order.lines.find((candidate) => candidate.sku === sku);
    if (!line) throw new Error(`SKU ${sku} was not part of this order`);
    if (quantity > line.quantity) throw new Error(`Cannot return more than purchased for ${sku}`);

    const discountCents = Math.round((line.discountCents * quantity) / line.quantity);
    const taxCents = Math.round((line.taxCents * quantity) / line.quantity);
    const merchandiseCents = line.unitPriceCents * quantity - discountCents;
    refundedLines.push({ sku, quantity, merchandiseCents, discountCents, taxCents });
  }

  // Outbound shipping is refundable only when the entire order is returned.
  // BUG: this checks only SKUs present in the return request, not every order line.
  const fullOrderReturned = refundedLines.every((returned) => {
    const ordered = order.lines.find((line) => line.sku === returned.sku);
    return returned.quantity === ordered.quantity;
  });
  const shippingCents = fullOrderReturned ? order.shippingCents : 0;
  const merchandiseCents = refundedLines.reduce((sum, line) => sum + line.merchandiseCents, 0);
  const taxCents = refundedLines.reduce((sum, line) => sum + line.taxCents, 0);

  return {
    lines: refundedLines,
    merchandiseCents,
    taxCents,
    shippingCents,
    totalCents: merchandiseCents + taxCents + shippingCents,
  };
}
