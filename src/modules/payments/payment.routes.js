const express = require("express");
const paymentController = require("./payment.controller");
const { protect, restrictTo } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const validateUUID = require("../../middlewares/uuid.middleware");
const { processPaymentValidation } = require("./payment.validator");

// --- 1. Customer Payments Router (/api/v1/payments) ---
const paymentRoutes = express.Router();
paymentRoutes.use(protect);

// Process payment (Customer only)
paymentRoutes.post(
  "/process",
  restrictTo("CUSTOMER"),
  processPaymentValidation,
  validate,
  paymentController.processPayment
);

// Get payment receipt by Order ID (Customer, Staff, Admin)
paymentRoutes.get(
  "/order/:orderId",
  validateUUID,
  paymentController.getPaymentByOrderId
);

// --- 2. Admin Payments Ledger Router (/api/v1/admin/payments) ---
const adminPaymentRoutes = express.Router();
adminPaymentRoutes.use(protect);
adminPaymentRoutes.use(restrictTo("ADMIN"));

// View all restaurant transactions
adminPaymentRoutes.get("/", paymentController.getAllPayments);

module.exports = {
  paymentRoutes,
  adminPaymentRoutes,
};
