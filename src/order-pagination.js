function encodeCursor(order) {
  return Buffer.from(JSON.stringify({ createdAt: order.createdAt, id: order.id })).toString(
    "base64url",
  );
}

function decodeCursor(cursor) {
  try {
    const value = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(value);
    if (
      typeof parsed?.createdAt !== "string" ||
      typeof parsed?.id !== "string" ||
      Number.isNaN(new Date(parsed.createdAt).getTime())
    ) {
      throw new Error("invalid cursor payload");
    }
    return { createdAt: parsed.createdAt, id: parsed.id };
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

  const boundary = after ? decodeCursor(after) : null;
  const eligible = boundary
    ? sorted.filter((order) => compareOrders(boundary, order) < 0)
    : sorted;
  const items = eligible.slice(0, limit);
  const hasMore = eligible.length > items.length;
  return {
    items,
    nextCursor: hasMore && items.length ? encodeCursor(items.at(-1)) : null,
  };
}
