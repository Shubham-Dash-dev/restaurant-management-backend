const { body } = require("express-validator");

const createCategoryValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 100 })
    .withMessage("Category name cannot exceed 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
];

const updateCategoryValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Category name cannot exceed 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 }),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean (true or false)"),
];

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,
};
