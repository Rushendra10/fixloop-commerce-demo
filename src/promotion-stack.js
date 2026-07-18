function nonNegativeInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative integer`);
  }
  return value;
}

export function pricePromotionStack({
  subtotalCents,
  percentageBasisPoints = 0,
  fixedCreditsCents = [],
  maxDiscountBasisPoints = 5_000,
}) {
  nonNegativeInteger(subtotalCents, "subtotalCents");
  nonNegativeInteger(percentageBasisPoints, "percentageBasisPoints");
  nonNegativeInteger(maxDiscountBasisPoints, "maxDiscountBasisPoints");
  if (percentageBasisPoints > 10_000 || maxDiscountBasisPoints > 10_000) {
    throw new RangeError("basis points cannot exceed 10000");
  }
  if (!Array.isArray(fixedCreditsCents)) {
    throw new TypeError("fixedCreditsCents must be an array");
  }
  fixedCreditsCents.forEach((credit, index) => nonNegativeInteger(credit, `fixedCreditsCents[${index}]`));

  const percentageDiscountCents = Math.round((subtotalCents * percentageBasisPoints) / 10_000);
  const maximumDiscountCents = Math.floor((subtotalCents * maxDiscountBasisPoints) / 10_000);
  const cappedPercentageCents = Math.min(percentageDiscountCents, maximumDiscountCents);
  const fixedCreditCents = fixedCreditsCents.reduce((sum, credit) => sum + credit, 0);

  // The percentage discount is capped before fixed credits are added. A stack
  // can therefore exceed the aggregate promotion cap configured by checkout.
  const discountCents = Math.min(subtotalCents, cappedPercentageCents + fixedCreditCents);
  return {
    subtotalCents,
    percentageDiscountCents,
    fixedCreditCents,
    maximumDiscountCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
}
