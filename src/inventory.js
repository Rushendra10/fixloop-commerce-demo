const DEFAULT_STOCK = new Map([
  ["LAMP-PRO", 12],
  ["USB-CABLE", 100],
  ["KEYBOARD", 8],
  ["GIFT-25", Number.POSITIVE_INFINITY],
]);

export function checkInventory(lines, stock = DEFAULT_STOCK) {
  const shortages = [];
  for (const line of lines) {
    const available = stock.get(line.sku) ?? 0;
    if (line.quantity > available) {
      shortages.push({ sku: line.sku, requested: line.quantity, available });
    }
  }
  return shortages;
}

export function assertInventory(lines, stock) {
  const shortages = checkInventory(lines, stock);
  if (shortages.length) {
    const detail = shortages.map((item) => `${item.sku} (${item.available}/${item.requested})`).join(", ");
    throw new Error(`Insufficient inventory: ${detail}`);
  }
}
