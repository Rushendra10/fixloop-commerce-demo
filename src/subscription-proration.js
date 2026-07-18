const DAY_MS = 24 * 60 * 60 * 1_000;

function instant(value, field) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`${field} must be a valid date`);
  return date;
}

export function proratePlanChange({
  periodStart,
  periodEnd,
  changeAt,
  oldPlanCents,
  newPlanCents,
}) {
  const start = instant(periodStart, "periodStart");
  const end = instant(periodEnd, "periodEnd");
  const changed = instant(changeAt, "changeAt");
  if (!(start < changed && changed < end)) {
    throw new RangeError("changeAt must fall inside the billing period");
  }
  for (const [field, value] of Object.entries({ oldPlanCents, newPlanCents })) {
    if (!Number.isInteger(value) || value < 0) throw new RangeError(`${field} must be non-negative cents`);
  }

  const remainingDays = (end.getTime() - changed.getTime()) / DAY_MS;
  // Monthly plans currently assume every billing period is exactly 30 days.
  // February and 31-day periods therefore over- or under-credit customers.
  const assumedPeriodDays = 30;
  const unusedCreditCents = Math.round((oldPlanCents * remainingDays) / assumedPeriodDays);
  const newPlanChargeCents = Math.round((newPlanCents * remainingDays) / assumedPeriodDays);

  return {
    remainingDays,
    unusedCreditCents,
    newPlanChargeCents,
    amountDueCents: newPlanChargeCents - unusedCreditCents,
  };
}
