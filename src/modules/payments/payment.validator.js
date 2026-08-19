const { body } = require("express-validator");
const { PAYMENT_METHODS } = require("../../constants/paymentStatus");

const processPaymentValidation = [
  body("orderId")
    .trim()
    .notEmpty()
    .withMessage("Order ID is required")
    .isUUID()
    .withMessage("Invalid Order ID format. Must be a valid UUID."),

  body("paymentMethod")
    .optional()
    .trim()
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage(
      `Invalid payment method. Allowed: ${Object.values(PAYMENT_METHODS).join(", ")}`
    ),
];

module.exports = {
  processPaymentValidation,
};
