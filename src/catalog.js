const PRODUCTS = new Map([
  ["LAMP-PRO", {
    sku: "LAMP-PRO",
    name: "Adjustable desk lamp",
    unitPriceCents: 4_000,
    warehouse: "west",
    weightGrams: 1_800,
    taxable: true,
    shippable: true,
  }],
  ["USB-CABLE", {
    sku: "USB-CABLE",
    name: "Braided USB-C cable",
    unitPriceCents: 2_000,
    warehouse: "east",
    weightGrams: 180,
    taxable: true,
    shippable: true,
  }],
  ["KEYBOARD", {
    sku: "KEYBOARD",
    name: "Mechanical keyboard",
    unitPriceCents: 8_500,
    warehouse: "east",
    weightGrams: 1_100,
    taxable: true,
    shippable: true,
  }],
  ["GIFT-25", {
    sku: "GIFT-25",
    name: "$25 digital gift card",
    unitPriceCents: 2_500,
    warehouse: "digital",
    weightGrams: 0,
    taxable: false,
    shippable: false,
    promotionEligible: false,
  }],
]);

export function getProduct(sku) {
  const product = PRODUCTS.get(sku);
  if (!product) throw new Error(`Unknown SKU: ${sku}`);
  return { ...product };
}

export function listProducts() {
  return [...PRODUCTS.values()].map((product) => ({ ...product }));
}
