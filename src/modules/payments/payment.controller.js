const paymentService = require("./payment.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");

// 1. Customer: Process / Simulate Payment for Order
module.exports.processPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.processPayment(req.user.id, req.body);
    return sendSuccess(res, 201, "Payment processed successfully", payment);
  } catch (error) {
    const statusCode = error.message === "Order not found" ? 404 : 400;
    return sendError(res, statusCode, error.message, error);
  }
};

// 2. Customer / Staff / Admin: Get payment receipt by Order ID
module.exports.getPaymentByOrderId = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentByOrderId(
      req.params.orderId,
      req.user.id,
      req.user.role
    );
    return sendSuccess(res, 200, "Payment details fetched successfully", payment);
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return sendError(res, statusCode, error.message, error);
  }
};

// 3. Admin: Get all restaurant payments ledger
module.exports.getAllPayments = async (req, res, next) => {
  try {
    const result = await paymentService.getAllPayments(req.query);
    return sendSuccess(res, 200, "Payments ledger fetched successfully", result);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};
