function parseDate(value, field) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`${field} must be a valid date`);
  return date;
}

function availableLots(lots, asOf) {
  const now = parseDate(asOf, "asOf");
  return lots
    .map((lot) => {
      if (!lot?.id || !Number.isInteger(lot.points) || lot.points < 1) {
        throw new TypeError("each loyalty lot requires an id and positive points");
      }
      const earnedAt = parseDate(lot.earnedAt, "earnedAt");
      const expiresAt = lot.expiresAt ? parseDate(lot.expiresAt, "expiresAt") : null;
      return { ...lot, earnedAt, expiresAt };
    })
    .filter((lot) => !lot.expiresAt || lot.expiresAt > now);
}

export function redeemPoints(lots, requestedPoints, asOf) {
  if (!Array.isArray(lots)) throw new TypeError("lots must be an array");
  if (!Number.isInteger(requestedPoints) || requestedPoints < 1) {
    throw new RangeError("requestedPoints must be a positive integer");
  }

  const available = availableLots(lots, asOf);
  const total = available.reduce((sum, lot) => sum + lot.points, 0);
  if (requestedPoints > total) throw new Error(`insufficient points: ${total} available`);

  // Consume earliest-expiring lots first so customers do not lose points
  // unnecessarily. Lots without expiration are treated as last; equal
  // expirations break by oldest earnedAt, then stable lot id.
  available.sort((left, right) => {
    const leftExpiry = left.expiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightExpiry = right.expiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return (
      leftExpiry - rightExpiry ||
      left.earnedAt - right.earnedAt ||
      String(left.id).localeCompare(String(right.id))
    );
  });

  let remaining = requestedPoints;
  const allocations = [];
  for (const lot of available) {
    if (remaining === 0) break;
    const points = Math.min(remaining, lot.points);
    allocations.push({ lotId: lot.id, points });
    remaining -= points;
  }
  return { requestedPoints, allocations };
}
