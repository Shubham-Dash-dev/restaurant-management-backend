const AppDataSource = require("../../database/data-source");
const orderRepository = require("./order.repository");
const cartRepository = require("../cart/cart.repository");
const notificationService = require("../notifications/notification.service");
const { ORDER_STATUS, ALLOWED_STATUS_TRANSITIONS } = require("../../constants/orderStatus");
const paymentRepository = require("../payments/payment.repository");
const { PAYMENT_STATUS } = require("../../constants/paymentStatus");

// Helper: Format single order receipt for API responses
const formatOrderReceipt = (order) => {
  if (!order) return null;

  const items = (order.items || []).map((item) => {
    const unitPrice = Number(item.priceAtPurchase); // Notice we use item.priceAtPurchase (the price snapshot) instead of item.menuItem.price.
    const subtotal = Number((unitPrice * item.quantity).toFixed(2));

    return {
      id: item.id,
      quantity: item.quantity,
      priceAtPurchase: unitPrice,
      subtotal,
      menuItem: item.menuItem
        ? {
            id: item.menuItem.id,
            name: item.menuItem.name,
            imageUrl: item.menuItem.imageUrl,
            isVeg: item.menuItem.isVeg,
            category: item.menuItem.category ? item.menuItem.category.name : null,
          }
        : null,
    };
  });

  return {
    id: order.id,
    userId: order.userId,
    customerName: order.user ? (order.user.fullName || order.user.name) : null,
    customerEmail: order.user ? order.user.email : null,
    customerPhone: order.user ? order.user.phone : null,
    orderStatus: order.orderStatus,
    totalAmount: Number(Number(order.totalAmount).toFixed(2)),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items,
  };
};

// 1. PLACE ORDER (ACID Database Transaction)
const placeOrder = async (userId) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Step 1: Fetch user's cart
    const cart = await cartRepository.findCartByUserId(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error("Your cart is empty. Add dishes before placing an order.");
    }

    // Step 2: Validate stock and active category for EVERY dish in cart
    let totalAmount = 0;
    const orderItemsToCreate = [];

    for (const cartItem of cart.items) {
      const menuItem = cartItem.menuItem;

      if (!menuItem) {
        throw new Error("One or more items in your cart no longer exist.");
      }

      if (!menuItem.isAvailable) {
        throw new Error(`"${menuItem.name}" is currently out of stock. Please remove it from your cart.`);
      }

      if (!menuItem.category || !menuItem.category.isActive) {
        throw new Error(`"${menuItem.name}" belongs to an inactive category and cannot be ordered.`);
      }

      const unitPrice = Number(menuItem.price);
      totalAmount += unitPrice * cartItem.quantity;

      orderItemsToCreate.push({
        menuItemId: menuItem.id,
        quantity: cartItem.quantity,
        priceAtPurchase: unitPrice, // Price snapshot
      });
    }


    totalAmount = Number(totalAmount.toFixed(2));

    // Step 3: Create Order Header (Inside Transaction)
    const newOrder = await orderRepository.createOrder(
      {
        userId,
        orderStatus: ORDER_STATUS.PENDING,
        totalAmount,
      },
      queryRunner.manager
    );

    // Step 4: Insert Order Items linked to this new order (Inside Transaction)
    const itemsWithOrderId = orderItemsToCreate.map((item) => ({
      ...item,
      orderId: newOrder.id,
    }));
    await orderRepository.createOrderItems(itemsWithOrderId, queryRunner.manager);

    // Step 5: Clear Customer's Cart (Inside Transaction)
    await cartRepository.clearCart(cart.id);

    // Step 6: Create Notification for Customer (Inside Transaction)
    await notificationService.createNotification(
      {
        userId,
        orderId: newOrder.id,
        title: "Order Placed Successfully",
        message: `Your order #${newOrder.id.slice(0, 8)} for ₹${totalAmount} has been placed.`,
      },
      queryRunner.manager
    );

    // Step 7: Commit Transaction (All operations succeeded atomically!)
    await queryRunner.commitTransaction();

    // Fetch and return complete order receipt
    const placedOrder = await orderRepository.findOrderById(newOrder.id);
    return formatOrderReceipt(placedOrder);
  } catch (error) {
    // If ANY step fails, roll back everything! Cart remains unchanged.
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    // Always release the database connection back to the pool
    await queryRunner.release();
    //i am finished using this database connection. Give it back to the connection pool so another request can use it."
  }
};

// 2. Get customer's order history
const getCustomerOrders = async (userId, queryParams) => {
  const cleanQuery = {};
  Object.keys(queryParams).forEach((key) => {
    cleanQuery[key.trim()] = queryParams[key];
  });

  const page = Math.max(1, Number(cleanQuery.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(cleanQuery.limit) || 10));

  const [orders, total] = await orderRepository.findUserOrders(userId, {
    page,
    limit,
    status: cleanQuery.status,
  });

  return {
    orders: orders.map(formatOrderReceipt),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// 3. Get single order details (with ownership security check)
const getOrderById = async (orderId, userId, userRole) => {
  const order = await orderRepository.findOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  // Security: If a Customer is requesting, verify they own this order
  if (userRole === "CUSTOMER" && order.userId !== userId) {
    throw new Error("Unauthorized: You do not have permission to view this order");
  }

  return formatOrderReceipt(order);
};

// 4. Cancel order (Customer Rule: Only allowed while status is 'Pending')
const cancelOrder = async (orderId, userId) => {
  const order = await orderRepository.findOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  // Security: Customer can only cancel their own order
  if (order.userId !== userId) {
    throw new Error("Unauthorized: You do not have permission to cancel this order");
  }

  // Business Rule: Can only cancel while status is 'Pending'
  if (order.orderStatus !== ORDER_STATUS.PENDING) {
    throw new Error(
      `Cannot cancel order. Order is already in "${order.orderStatus}" stage.`
    );
  }

  const updatedOrder = await orderRepository.updateOrderStatus(
    orderId,
    ORDER_STATUS.CANCELLED
  );
  
    // Check if order was already paid. If YES -> Automatically initiate Refund!
  const payment = await paymentRepository.findPaymentByOrderId(orderId);
  if (payment && payment.paymentStatus === PAYMENT_STATUS.COMPLETED) {
    await paymentRepository.updatePaymentStatus(payment.id, PAYMENT_STATUS.REFUNDED);
    // Send Refund Notification
    await notificationService.createNotification({
      userId: order.userId,
      orderId: order.id,
      title: "Refund Initiated",
      message: `Refund of ₹${payment.amount} has been initiated for your cancelled order #${order.id.slice(0, 8)}.`,
    });
  }

  // Create Cancellation Notification for Customer
  await notificationService.createNotification({
    userId: order.userId,
    orderId: order.id,
    title: "Order Cancelled",
    message: `Your order #${order.id.slice(0, 8)} has been cancelled.`,
  });

  return formatOrderReceipt(updatedOrder);
};

// 5. Update order status (Staff / Admin Kitchen Workflow)
const updateOrderStatus = async (orderId, newStatus) => {
  const order = await orderRepository.findOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (!Object.values(ORDER_STATUS).includes(newStatus)) {
    throw new Error(`Invalid status "${newStatus}". Allowed: ${Object.values(ORDER_STATUS).join(", ")}`);
  }

  // Check state transition lifecycle: Pending ➔ Preparing ➔ Prepared ➔ Served
  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[order.orderStatus] || [];
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new Error(
      `Cannot change order status from "${order.orderStatus}" to "${newStatus}".`
    );
  }

  const updatedOrder = await orderRepository.updateOrderStatus(orderId, newStatus);

  // Create Status Update Notification for Customer
  const statusMessages = {
    [ORDER_STATUS.PREPARING]: "is now being prepared in the kitchen.",
    [ORDER_STATUS.PREPARED]: "is prepared and ready to be served!",
    [ORDER_STATUS.SERVED]: "has been served. Enjoy your meal!",
  };

  if (statusMessages[newStatus]) {
    await notificationService.createNotification({
      userId: order.userId,
      orderId: order.id,
      title: `Order ${newStatus}`,
      message: `Your order #${order.id.slice(0, 8)} ${statusMessages[newStatus]}`,
    });
  }

  return formatOrderReceipt(updatedOrder);
};

// 6. Get all restaurant orders (Admin)
const getAllOrders = async (queryParams) => {
  const cleanQuery = {};
  Object.keys(queryParams).forEach((key) => {
    cleanQuery[key.trim()] = queryParams[key];
  });

  const page = Math.max(1, Number(cleanQuery.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(cleanQuery.limit) || 10));

  const [orders, total] = await orderRepository.findAllOrders({
    page,
    limit,
    status: cleanQuery.status,
    startDate: cleanQuery.startDate,
    endDate: cleanQuery.endDate,
  });

  return {
    orders: orders.map(formatOrderReceipt),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// 7. Get incoming kitchen orders (Staff FIFO Queue)
const getStaffOrders = async (queryParams) => {
  const cleanQuery = {};
  Object.keys(queryParams).forEach((key) => {
    cleanQuery[key.trim()] = queryParams[key];
  });

  const page = Math.max(1, Number(cleanQuery.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(cleanQuery.limit) || 20));

  const [orders, total] = await orderRepository.findStaffOrders({
    page,
    limit,
    status: cleanQuery.status,
  });

  return {
    orders: orders.map(formatOrderReceipt),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = {
  placeOrder,
  getCustomerOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
  getStaffOrders,
};
