function validateLine(line) {
  if (!line?.sku || !Number.isInteger(line.quantity) || line.quantity < 1) {
    throw new TypeError("each line requires a sku and positive integer quantity");
  }
}

function validateStock(stockByWarehouse) {
  if (!stockByWarehouse || typeof stockByWarehouse !== "object") {
    throw new TypeError("stockByWarehouse is required");
  }
  for (const stock of Object.values(stockByWarehouse)) {
    for (const quantity of Object.values(stock)) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new RangeError("warehouse stock must contain non-negative integers");
      }
    }
  }
}

export function allocateFulfillment(lines, stockByWarehouse, warehousePriority) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new TypeError("at least one order line is required");
  }
  lines.forEach(validateLine);
  validateStock(stockByWarehouse);
  if (!Array.isArray(warehousePriority) || warehousePriority.length === 0) {
    throw new TypeError("warehousePriority is required");
  }

  const allocations = [];
  for (const line of lines) {
    // A line is assigned only when one warehouse can satisfy it in full. This
    // rejects valid orders whose combined inventory is sufficient.
    const warehouse = warehousePriority.find(
      (candidate) => (stockByWarehouse[candidate]?.[line.sku] ?? 0) >= line.quantity,
    );
    if (!warehouse) throw new Error(`insufficient stock for ${line.sku}`);
    allocations.push({
      lineId: line.id ?? null,
      sku: line.sku,
      warehouse,
      quantity: line.quantity,
    });
  }
  return allocations;
}
