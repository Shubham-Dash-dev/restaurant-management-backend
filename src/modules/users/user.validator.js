const { body } = require("express-validator");

const createUserValidation = [
// if an error occurs during validation , express-validator attaches an error list directly to the req object inside express
    body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ max: 100 })
    .withMessage("Full name cannot exceed 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("phone")
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),

  body("role")
    .optional()
    .isIn(["ADMIN", "STAFF", "CUSTOMER"])
    .withMessage("Role must be ADMIN, STAFF, or CUSTOMER"),
];

const updateUserValidation = [
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .isLength({ max: 100 }),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("phone")
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),
  body("role")
    .optional()
    .isIn(["ADMIN", "STAFF", "CUSTOMER"])
    .withMessage("Role must be ADMIN, STAFF, or CUSTOMER"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean (true or false)"),
];
module.exports = {
  createUserValidation,
  updateUserValidation,
};