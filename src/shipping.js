const BASE_RATES = {
  west: { baseCents: 650, perKilogramCents: 120 },
  east: { baseCents: 600, perKilogramCents: 150 },
};

function groupShippableLines(lines) {
  const groups = new Map();
  for (const line of lines.filter((item) => item.shippable)) {
    const current = groups.get(line.warehouse) ?? [];
    current.push(line);
    groups.set(line.warehouse, current);
  }
  return groups;
}

function paidRateFor(warehouse, lines) {
  const rate = BASE_RATES[warehouse];
  if (!rate) throw new Error(`No shipping rate for warehouse: ${warehouse}`);
  const weightGrams = lines.reduce((sum, line) => sum + line.weightGrams * line.quantity, 0);
  const kilograms = Math.max(1, Math.ceil(weightGrams / 1_000));
  return { weightGrams, shippingCents: rate.baseCents + kilograms * rate.perKilogramCents };
}

export function quoteShipping(lines, { freeShippingThresholdCents = 6_000 } = {}) {
  const groups = groupShippableLines(lines);

  const shipments = [...groups.entries()].map(([warehouse, groupLines]) => {
    const paid = paidRateFor(warehouse, groupLines);
    const merchandiseCents = groupLines.reduce((sum, line) => sum + line.netCents, 0);
    const qualifiesForFreeShipping = merchandiseCents >= freeShippingThresholdCents;
    return {
      warehouse,
      skus: groupLines.map((line) => line.sku).sort(),
      merchandiseCents,
      weightGrams: paid.weightGrams,
      shippingCents: qualifiesForFreeShipping ? 0 : paid.shippingCents,
      freeShipping: qualifiesForFreeShipping,
    };
  });

  return {
    shipments,
    shippingCents: shipments.reduce((sum, shipment) => sum + shipment.shippingCents, 0),
  };
}
