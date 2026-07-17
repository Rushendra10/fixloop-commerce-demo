const STATE_RATES = new Map([
  ["CA", 725],
  ["NY", 800],
  ["OR", 0],
  ["TX", 625],
]);

export function taxRateFor(destination) {
  const state = destination?.state?.toUpperCase();
  if (!state || !STATE_RATES.has(state)) {
    throw new Error(`Unsupported destination state: ${state ?? "missing"}`);
  }
  return STATE_RATES.get(state);
}

export function calculateTax(lines, destination) {
  const rateBasisPoints = taxRateFor(destination);
  const taxedLines = lines.map((line) => {
    const taxableCents = line.taxable ? line.netCents : 0;
    const taxCents = Math.round((taxableCents * rateBasisPoints) / 10_000);
    return { ...line, taxCents };
  });
  return {
    rateBasisPoints,
    taxCents: taxedLines.reduce((sum, line) => sum + line.taxCents, 0),
    lines: taxedLines,
  };
}
