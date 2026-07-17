export function assertCents(value, name = "amount") {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${name} must be an integer number of cents`);
  }
  return value;
}

export function addCents(values) {
  return values.reduce((total, value) => total + assertCents(value), 0);
}

export function percentageOf(cents, basisPoints) {
  assertCents(cents);
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) {
    throw new RangeError("basisPoints must be between 0 and 10000");
  }
  return Math.round((cents * basisPoints) / 10_000);
}

export function formatUsd(cents) {
  assertCents(cents);
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}$${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

export function sumField(rows, field) {
  return addCents(rows.map((row) => row[field] ?? 0));
}
