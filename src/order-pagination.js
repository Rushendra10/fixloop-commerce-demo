function encodeCursor(order) {
  return Buffer.from(order.createdAt).toString("base64url");
}

function decodeCursor(cursor) {
  try {
    const value = Buffer.from(cursor, "base64url").toString("utf8");
    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) throw new Error("invalid timestamp");
    return timestamp;
  } catch (error) {
    throw new TypeError("invalid order cursor", { cause: error });
  }
}

function compareOrders(left, right) {
  const byTime = new Date(right.createdAt) - new Date(left.createdAt);
  return byTime || right.id.localeCompare(left.id);
}

export function paginateOrders(orders, { limit = 20, after = null } = {}) {
  if (!Array.isArray(orders)) throw new TypeError("orders must be an array");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError("limit must be between 1 and 100");
  }
  const sorted = orders.map((order) => {
    if (!order?.id || Number.isNaN(new Date(order.createdAt).getTime())) {
      throw new TypeError("every order requires an id and valid createdAt");
    }
    return { ...order };
  }).sort(compareOrders);

  // The cursor only contains createdAt. Orders sharing the boundary timestamp
  // are all filtered out even if they did not fit on the previous page.
  const boundary = after ? decodeCursor(after) : null;
  const eligible = boundary
    ? sorted.filter((order) => new Date(order.createdAt) < boundary)
    : sorted;
  const items = eligible.slice(0, limit);
  const hasMore = eligible.length > items.length;
  return {
    items,
    nextCursor: hasMore && items.length ? encodeCursor(items.at(-1)) : null,
  };
}
