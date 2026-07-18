function normalizePostalCode(postalCode) {
  if (typeof postalCode !== "string") throw new TypeError("postalCode must be a string");
  const normalized = postalCode.trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized) throw new TypeError("postalCode cannot be empty");
  return normalized;
}

function validateZone(zone) {
  if (!zone?.id || !Array.isArray(zone.prefixes) || zone.prefixes.length === 0) {
    throw new TypeError("each shipping zone requires an id and postal prefixes");
  }
  if (!Number.isInteger(zone.baseRateCents) || zone.baseRateCents < 0) {
    throw new RangeError(`invalid base rate for zone ${zone.id}`);
  }
}

export function resolveShippingZone(postalCode, zones) {
  const normalized = normalizePostalCode(postalCode);
  if (!Array.isArray(zones) || zones.length === 0) {
    throw new TypeError("at least one shipping zone is required");
  }
  zones.forEach(validateZone);

  // Configuration order currently decides the winner. This is incorrect when
  // a broad prefix ("9") overlaps a more specific prefix ("941").
  const zone = zones.find((candidate) =>
    candidate.prefixes.some((prefix) => normalized.startsWith(prefix.toUpperCase())),
  );
  if (!zone) throw new Error(`no shipping zone matches ${normalized}`);

  return {
    zoneId: zone.id,
    postalCode: normalized,
    baseRateCents: zone.baseRateCents,
  };
}
