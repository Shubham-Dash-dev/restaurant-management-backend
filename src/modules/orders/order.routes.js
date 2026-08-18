const express = require("express");
const orderController = require("./order.controller");
const { protect, restrictTo } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const validateUUID = require("../../middlewares/uuid.middleware");
const { updateOrderStatusValidation } = require("./order.validator");

// --- 1. Customer Orders Router (/api/v1/orders) ---
const orderRoutes = express.Router();
orderRoutes.use(protect);

// Place new order (Customer only)
orderRoutes.post("/", restrictTo("CUSTOMER"), orderController.placeOrder);

// Get order history (Customer only)
orderRoutes.get("/", restrictTo("CUSTOMER"), orderController.getCustomerOrders);

// Get single order receipt (Customer, Staff, Admin)
orderRoutes.get("/:id", validateUUID, orderController.getOrderById);

// Cancel pending order (Customer only)
orderRoutes.patch(
  "/:id/cancel",
  restrictTo("CUSTOMER"),
  validateUUID,
  orderController.cancelOrder
);

// --- 2. Staff Orders Router (/api/v1/staff/orders) ---
const staffOrderRoutes = express.Router();
staffOrderRoutes.use(protect);
staffOrderRoutes.use(restrictTo("STAFF", "ADMIN"));

// Get incoming kitchen orders (FIFO)
staffOrderRoutes.get("/", orderController.getStaffOrders);

// Update order status (Pending -> Preparing -> Prepared -> Served)
staffOrderRoutes.patch(
  "/:id/status",
  validateUUID,
  updateOrderStatusValidation,
  validate,
  orderController.updateOrderStatus
);

// --- 3. Admin Orders Router (/api/v1/admin/orders) ---
const adminOrderRoutes = express.Router();
adminOrderRoutes.use(protect);
adminOrderRoutes.use(restrictTo("ADMIN"));

// View all restaurant orders
adminOrderRoutes.get("/", orderController.getAllOrders);

module.exports = {
  orderRoutes,
  staffOrderRoutes,
  adminOrderRoutes,
};
