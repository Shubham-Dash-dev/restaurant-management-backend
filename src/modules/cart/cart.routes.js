const express = require("express");
const router = express.Router();
const cartController = require("./cart.controller");
const { protect, restrictTo } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const validateUUID = require("../../middlewares/uuid.middleware");
const {
  addToCartValidation,
  updateQuantityValidation,
} = require("./cart.validator");

// All Cart routes require Authentication & Customer Role
router.use(protect);
router.use(restrictTo("CUSTOMER"));

// get current customer's cart
router.get("/", cartController.getCart);

// add item to cart
router.post("/items", addToCartValidation, validate, cartController.addToCart);

// clear entire cart 
router.delete("/clear", cartController.clearCart);

// update cart item quantity
router.patch("/items/:id", validateUUID, updateQuantityValidation, validate, cartController.updateQuantity);

// remove single item from cart
router.delete("/items/:id", validateUUID, cartController.removeCartItem);

module.exports = router;
