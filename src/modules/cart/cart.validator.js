const { body } = require("express-validator");

const addToCartValidation = [
  body("menuItemId")
    .trim()
    .notEmpty()
    .withMessage("Menu item ID is required")
    .isUUID()
    .withMessage("Invalid Menu item ID format. Must be a valid UUID."),

  body("quantity")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Quantity must be an integer between 1 and 50"),
];

const updateQuantityValidation = [
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1, max: 50 })
    .withMessage("Quantity must be an integer between 1 and 50"),
];

module.exports = {
  addToCartValidation,
  updateQuantityValidation,
};
