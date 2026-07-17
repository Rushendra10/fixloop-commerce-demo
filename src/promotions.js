import { percentageOf } from "./money.js";

const COUPONS = new Map([
  ["VIP20", { code: "VIP20", percentBasisPoints: 2_000 }],
  ["WELCOME10", { code: "WELCOME10", percentBasisPoints: 1_000 }],
]);

function eligible(line) {
  return line.promotionEligible !== false;
}

function allocateProportionally(lines, totalDiscountCents) {
  const eligibleSubtotal = lines.filter(eligible).reduce((sum, line) => sum + line.grossCents, 0);
  if (!eligibleSubtotal || !totalDiscountCents) return new Map();

  const shares = lines.filter(eligible).map((line) => {
    const exact = (totalDiscountCents * line.grossCents) / eligibleSubtotal;
    return { sku: line.sku, cents: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = totalDiscountCents - shares.reduce((sum, share) => sum + share.cents, 0);
  shares.sort((a, b) => b.remainder - a.remainder || a.sku.localeCompare(b.sku));
  for (const share of shares) {
    if (remaining-- <= 0) break;
    share.cents += 1;
  }
  return new Map(shares.map((share) => [share.sku, share.cents]));
}

export function applyCoupon(lines, couponCode) {
  const coupon = couponCode ? COUPONS.get(couponCode) : null;
  if (couponCode && !coupon) throw new Error(`Unknown coupon: ${couponCode}`);

  const eligibleSubtotal = lines.filter(eligible).reduce((sum, line) => sum + line.grossCents, 0);
  const discountCents = coupon ? percentageOf(eligibleSubtotal, coupon.percentBasisPoints) : 0;
  const allocations = allocateProportionally(lines, discountCents);
  const discountedLines = lines.map((line) => {
    const lineDiscountCents = allocations.get(line.sku) ?? 0;
    return {
      ...line,
      discountCents: lineDiscountCents,
      netCents: line.grossCents - lineDiscountCents,
    };
  });
  return { coupon: coupon?.code ?? null, discountCents, lines: discountedLines };
}
