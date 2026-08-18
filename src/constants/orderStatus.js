const ORDER_STATUS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  PREPARED: "Prepared",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

// Strict Order Status Lifecycle:
// Pending ➔ Preparing ➔ Prepared ➔ Served
const ALLOWED_STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.PREPARED],
  [ORDER_STATUS.PREPARED]: [ORDER_STATUS.SERVED],
  [ORDER_STATUS.SERVED]: [], // Final state: No further updates allowed
  [ORDER_STATUS.CANCELLED]: [], // Final state: No further updates allowed
};

module.exports = {
  ORDER_STATUS,
  ALLOWED_STATUS_TRANSITIONS,
};
