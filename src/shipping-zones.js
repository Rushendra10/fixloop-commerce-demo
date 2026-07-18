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

  let best = null;
  for (const candidate of zones) {
    for (const prefix of candidate.prefixes) {
      const normalizedPrefix = prefix.toUpperCase();
      if (!normalized.startsWith(normalizedPrefix)) continue;

      const prefixLength = normalizedPrefix.length;
      if (!best || prefixLength > best.prefixLength) {
        best = { zone: candidate, prefixLength };
      } else if (
        prefixLength === best.prefixLength &&
        candidate.id !== best.zone.id
      ) {
        throw new Error(`ambiguous shipping zone match for ${normalized}`);
      }
    }
  }
  if (!best) throw new Error(`no shipping zone matches ${normalized}`);

  return {
    zoneId: best.zone.id,
    postalCode: normalized,
    baseRateCents: best.zone.baseRateCents,
  };
}
