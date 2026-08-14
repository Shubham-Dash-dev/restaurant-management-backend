const { body } = require("express-validator");

const createMenuItemValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Dish name is required")
    .isLength({ max: 150 })
    .withMessage("Dish name cannot exceed 150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0.01 })  //Price must be a positive amount, not zero or negative. [DECIMAL(10,2)]
    .withMessage("Price must be a positive number"),

  body("imageUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Image URL must be a valid URL"),

  body("isVeg")
    .optional()
    .isBoolean()
    .withMessage("isVeg must be a boolean (true or false)"),

  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be a boolean (true or false)"),

  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .isUUID()
    .withMessage("Invalid Category ID format. Must be a valid UUID."),
];

const updateMenuItemValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Dish name cannot be empty")
    .isLength({ max: 150 }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }),

  body("price")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number"),

  body("imageUrl")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Image URL must be a valid URL"),

  body("isVeg")
    .optional()
    .isBoolean()
    .withMessage("isVeg must be a boolean"),

  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be a boolean"),

  body("categoryId")
    .optional()
    .isUUID()
    .withMessage("Invalid Category ID format. Must be a valid UUID."),
];

module.exports = {
  createMenuItemValidation,
  updateMenuItemValidation,
};
