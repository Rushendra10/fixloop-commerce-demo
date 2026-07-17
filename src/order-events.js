const EVENT_TYPES = new Set([
  "order.created",
  "payment.captured",
  "fulfillment.shipped",
  "refund.issued",
  "order.canceled",
]);

function validateEvent(event) {
  if (!event || typeof event.id !== "string" || event.id.length === 0) {
    throw new TypeError("every order event requires a non-empty id");
  }
  if (!EVENT_TYPES.has(event.type)) {
    throw new Error(`unsupported order event type: ${event.type}`);
  }
  if (!event.data || typeof event.data !== "object") {
    throw new TypeError(`event ${event.id} requires a data object`);
  }
}

function applyEvent(state, event) {
  switch (event.type) {
    case "order.created":
      if (state.created) throw new Error("order.created may only occur once");
      state.created = true;
      state.orderId = event.data.orderId;
      state.totalCents = event.data.totalCents;
      state.status = "pending_payment";
      break;
    case "payment.captured":
      state.capturedCents += event.data.amountCents;
      if (state.capturedCents >= state.totalCents) state.status = "paid";
      break;
    case "fulfillment.shipped":
      state.shipments.push({
        shipmentId: event.data.shipmentId,
        trackingNumber: event.data.trackingNumber,
      });
      state.status = "shipped";
      break;
    case "refund.issued":
      state.refundedCents += event.data.amountCents;
      state.status = state.refundedCents >= state.capturedCents ? "refunded" : "partially_refunded";
      break;
    case "order.canceled":
      state.status = "canceled";
      break;
  }
}

export function projectOrder(events) {
  if (!Array.isArray(events) || events.length === 0) {
    throw new TypeError("at least one order event is required");
  }
  const state = {
    orderId: null,
    created: false,
    status: "unknown",
    totalCents: 0,
    capturedCents: 0,
    refundedCents: 0,
    shipments: [],
  };

  for (const event of events) {
    validateEvent(event);
    applyEvent(state, event);
  }
  if (!state.created) throw new Error("event stream is missing order.created");
  return state;
}
