function validateStock(stockByWarehouse) {
  if (!stockByWarehouse || typeof stockByWarehouse !== "object") {
    throw new TypeError("stockByWarehouse is required");
  }
  for (const [warehouse, stock] of Object.entries(stockByWarehouse)) {
    for (const [sku, quantity] of Object.entries(stock)) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new RangeError(`invalid stock for ${warehouse}/${sku}`);
      }
    }
  }
}

function activeReservations(reservations, asOf) {
  const now = new Date(asOf);
  if (Number.isNaN(now.getTime())) throw new TypeError("asOf must be a valid date");
  return reservations.filter((reservation) => {
    if (!reservation.id || !reservation.warehouse || !reservation.sku) {
      throw new TypeError("reservation requires id, warehouse, and sku");
    }
    if (!Number.isInteger(reservation.quantity) || reservation.quantity < 1) {
      throw new RangeError("reservation quantity must be positive");
    }
    const expiresAt = new Date(reservation.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) throw new TypeError("expiresAt must be valid");
    return expiresAt > now;
  });
}

export function calculateAvailability(stockByWarehouse, reservations, asOf) {
  validateStock(stockByWarehouse);
  if (!Array.isArray(reservations)) throw new TypeError("reservations must be an array");
  const active = activeReservations(reservations, asOf);
  const availability = {};

  for (const [warehouse, stock] of Object.entries(stockByWarehouse)) {
    availability[warehouse] = {};
    for (const [sku, onHand] of Object.entries(stock)) {
      // Reservations are scoped to a warehouse. This currently subtracts
      // every reservation for the SKU, leaking demand across warehouses.
      const reserved = active
        .filter((reservation) => reservation.sku === sku)
        .reduce((total, reservation) => total + reservation.quantity, 0);
      availability[warehouse][sku] = Math.max(0, onHand - reserved);
    }
  }
  return availability;
}
