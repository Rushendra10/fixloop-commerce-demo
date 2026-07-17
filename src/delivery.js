function parseInstant(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("orderedAt must be a valid date");
  return date;
}

function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function nextBusinessDay(date) {
  const result = startOfUtcDay(date);
  do {
    result.setUTCDate(result.getUTCDate() + 1);
  } while (isWeekend(result));
  return result;
}

function addBusinessDays(date, days) {
  let result = startOfUtcDay(date);
  for (let remaining = days; remaining > 0; remaining -= 1) {
    result = nextBusinessDay(result);
  }
  return result;
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export function estimateDelivery({
  orderedAt,
  warehouseTimeZone = "UTC",
  cutoffHourLocal = 14,
  transitBusinessDays = 2,
}) {
  const ordered = parseInstant(orderedAt);
  if (!Number.isInteger(cutoffHourLocal) || cutoffHourLocal < 0 || cutoffHourLocal > 23) {
    throw new RangeError("cutoffHourLocal must be an hour from 0 through 23");
  }
  if (!Number.isInteger(transitBusinessDays) || transitBusinessDays < 0) {
    throw new RangeError("transitBusinessDays must be a non-negative integer");
  }

  // warehouseTimeZone is accepted by the API, but cutoff evaluation currently
  // uses the server's UTC clock instead of the warehouse's local wall clock.
  const beforeCutoff = ordered.getUTCHours() < cutoffHourLocal;
  const orderDay = startOfUtcDay(ordered);
  const processingDay = beforeCutoff && !isWeekend(orderDay)
    ? orderDay
    : nextBusinessDay(orderDay);
  const deliveryDay = addBusinessDays(processingDay, transitBusinessDays);

  return {
    warehouseTimeZone,
    beforeCutoff,
    processingDate: dateOnly(processingDay),
    estimatedDeliveryDate: dateOnly(deliveryDay),
  };
}
