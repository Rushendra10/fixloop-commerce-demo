function parseInstant(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("orderedAt must be a valid date");
  return date;
}

function zonedParts(date, timeZone) {
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      weekday: "short",
    });
  } catch {
    throw new RangeError(`Invalid IANA time zone: ${timeZone}`);
  }

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
  };
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

  const local = zonedParts(ordered, warehouseTimeZone);
  const beforeCutoff = local.hour < cutoffHourLocal;
  const orderDay = new Date(Date.UTC(local.year, local.month - 1, local.day));
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
