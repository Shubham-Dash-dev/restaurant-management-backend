const cartService = require("./cart.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");

// 1. Get current customer's cart
module.exports.getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    return sendSuccess(res, 200, "Cart fetched successfully", cart);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 2. Add item to cart
module.exports.addToCart = async (req, res, next) => {
  try {
    const cart = await cartService.addToCart(req.user.id, req.body);
    return sendSuccess(res, 200, "Item added to cart successfully", cart);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 3. Update cart item quantity
module.exports.updateQuantity = async (req, res, next) => {
  try {
    const cart = await cartService.updateCartItemQuantity(
      req.user.id,
      req.params.id,
      req.body.quantity
    );
    return sendSuccess(res, 200, "Cart item quantity updated successfully", cart);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 4. Remove a single item from cart
module.exports.removeCartItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeCartItem(req.user.id, req.params.id);
    return sendSuccess(res, 200, "Item removed from cart successfully", cart);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 5. Clear all items from cart
module.exports.clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    return sendSuccess(res, 200, "Cart cleared successfully", cart);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};
