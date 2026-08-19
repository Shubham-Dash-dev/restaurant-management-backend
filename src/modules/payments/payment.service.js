const paymentRepository = require("./payment.repository");
const orderRepository = require("../orders/order.repository");
const notificationService = require("../notifications/notification.service");
const { PAYMENT_STATUS, PAYMENT_METHODS } = require("../../constants/paymentStatus");

// Helper: Format clean payment receipt
const formatPayment = (payment) => {
  if (!payment) return null;

  return {
    id: payment.id,
    orderId: payment.orderId,
    userId: payment.userId,
    customerName: payment.user ? (payment.user.fullName || payment.user.name) : null,
    customerEmail: payment.user ? payment.user.email : null,
    amount: Number(payment.amount),
    paymentMethod: payment.paymentMethod,
    paymentStatus: payment.paymentStatus,
    transactionId: payment.transactionId,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  };
};

// 1. Process / Simulate Payment for an Order
const processPayment = async (userId, { orderId, paymentMethod = PAYMENT_METHODS.UPI }) => {
  // Step 1: Verify order exists
  const order = await orderRepository.findOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  // Step 2: Ownership Security Check (Only the order owner can pay)
  if (order.userId !== userId) {
    throw new Error("Unauthorized: You cannot pay for another customer's order");
  }

  // Step 3: Cannot pay for a cancelled order
  if (order.orderStatus === "Cancelled") {
    throw new Error("Cannot process payment for a cancelled order");
  }

  // Step 4: Validate payment method
  const allowedMethods = Object.values(PAYMENT_METHODS);
  if (!allowedMethods.includes(paymentMethod)) {
    throw new Error(`Invalid payment method. Allowed: ${allowedMethods.join(", ")}`);
  }

  // Step 5: Idempotency Check (Prevent double-paying for the same order)
  const existingPayment = await paymentRepository.findPaymentByOrderId(orderId);
  if (existingPayment && existingPayment.paymentStatus === PAYMENT_STATUS.COMPLETED) {
    throw new Error("This order has already been paid for");
  }

  // Step 6: Generate Unique Transaction ID (e.g. TXN_17240590_8F2A)
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Step 7: Create Payment Record
  const newPayment = await paymentRepository.createPayment({
    orderId,
    userId,
    amount: Number(order.totalAmount),
    paymentMethod,
    paymentStatus: PAYMENT_STATUS.COMPLETED,
    transactionId,
    paidAt: new Date(),
  });

  // Step 8: Trigger In-App Notification
  await notificationService.createNotification({
    userId,
    orderId,
    title: "Payment Received",
    message: `Payment of ₹${order.totalAmount} via ${paymentMethod} received for order #${order.id.slice(0, 8)}. Transaction ID: ${transactionId}`,
  });

  return formatPayment(newPayment);
};

// 2. Get payment receipt for an order
const getPaymentByOrderId = async (orderId, userId, userRole) => {
  const payment = await paymentRepository.findPaymentByOrderId(orderId);
  if (!payment) {
    throw new Error("Payment record not found for this order");
  }

  // Security: Customer can only view their own payment receipt
  if (userRole === "CUSTOMER" && payment.userId !== userId) {
    throw new Error("Unauthorized: You do not have permission to view this payment");
  }

  return formatPayment(payment);
};

// 3. Admin: Get all payments ledger
const getAllPayments = async (queryParams = {}) => {
  const cleanQuery = {};
  Object.keys(queryParams).forEach((key) => {
    cleanQuery[key.trim()] = queryParams[key];
  });

  const page = Math.max(1, Number(cleanQuery.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(cleanQuery.limit) || 10));

  const [payments, total] = await paymentRepository.findAllPayments({
    page,
    limit,
    paymentMethod: cleanQuery.paymentMethod,
    paymentStatus: cleanQuery.paymentStatus,
    startDate: cleanQuery.startDate,
    endDate: cleanQuery.endDate,
  });

  return {
    payments: payments.map(formatPayment),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = {
  processPayment,
  getPaymentByOrderId,
  getAllPayments,
};
