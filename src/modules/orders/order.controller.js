const orderService = require("./order.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");

// 1. Customer: Place a new order (from cart)
module.exports.placeOrder = async (req, res, next) => {
  try {
    const order = await orderService.placeOrder(req.user.id);
    return sendSuccess(res, 201, "Order placed successfully", order);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 2. Customer: Get own order history
module.exports.getCustomerOrders = async (req, res, next) => {
  try {
    const result = await orderService.getCustomerOrders(req.user.id, req.query);
    return sendSuccess(res, 200, "Order history fetched successfully", result);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 3. Customer / Staff / Admin: Get single order receipt by ID
module.exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    return sendSuccess(res, 200, "Order details fetched successfully", order);
  } catch (error) {
    return sendError(res, 404, error.message, error);
  }
};

// 4. Customer: Cancel pending order
module.exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user.id);
    return sendSuccess(res, 200, "Order cancelled successfully", order);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 5. Staff / Admin: Update order status (Pending -> Preparing -> Prepared -> Served)
module.exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(res, 200, "Order status updated successfully", order);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 6. Admin: View all restaurant orders
module.exports.getAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    return sendSuccess(res, 200, "All restaurant orders fetched successfully", result);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 7. Staff: View incoming kitchen queue (FIFO)
module.exports.getStaffOrders = async (req, res, next) => {
  try {
    const result = await orderService.getStaffOrders(req.query);
    return sendSuccess(res, 200, "Kitchen orders fetched successfully", result);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};
