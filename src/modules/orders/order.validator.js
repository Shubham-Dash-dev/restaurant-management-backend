const { body } = require("express-validator");
const { ORDER_STATUS } = require("../../constants/orderStatus");

const updateOrderStatusValidation = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Order status is required")
    .isIn(Object.values(ORDER_STATUS))
    .withMessage(
      `Invalid status. Allowed values: ${Object.values(ORDER_STATUS).join(", ")}`
    ),
];

module.exports = {
  updateOrderStatusValidation,
};
