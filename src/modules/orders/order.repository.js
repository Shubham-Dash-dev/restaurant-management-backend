const AppDataSource = require("../../database/data-source");
const Order = require("./order.entity");
const OrderItem = require("./orderItem.entity");
const { ORDER_STATUS } = require("../../constants/orderStatus");

const orderRepository = AppDataSource.getRepository(Order);
const orderItemRepository = AppDataSource.getRepository(OrderItem);

// find single order by ID with full item and user details
const findOrderById = async (orderId, manager = null) => {
  const repo = manager ? manager.getRepository(Order) : orderRepository;

  return await repo.findOne({
    where: { id: orderId },
    relations: {
      user: true,
      items: {
        menuItem: {
          category: true,
        },
      },
    },
    order: {
      items: {
        createdAt: "ASC", // the first dish added appears at the top of the bill
      },
    },
  });
};

// find paginated orders for a specific customer : (Customer's "My Orders" Screen)
const findUserOrders = async (userId, { page = 1, limit = 10, status }) => {
  const skip = (page - 1) * limit;

  const queryBuilder = orderRepository
    .createQueryBuilder("order")
    .leftJoinAndSelect("order.user", "user")
    .leftJoinAndSelect("order.items", "items")
    .leftJoinAndSelect("items.menuItem", "menuItem")
    .leftJoinAndSelect("menuItem.category", "category")
    .where("order.userId = :userId", { userId });

  if (status) {
    queryBuilder.andWhere("order.orderStatus = :status", { status });
  }

  queryBuilder
    .orderBy("order.createdAt", "DESC")
    .skip(skip)
    .take(limit);

  return await queryBuilder.getManyAndCount();
};

// find all restaurant orders (Admin query with status/date filters)
const findAllOrders = async ({page = 1, limit = 10, status, startDate, endDate }) => {
  const skip = (page - 1) * limit;

  const queryBuilder = orderRepository
    .createQueryBuilder("order")
    .leftJoinAndSelect("order.user", "user")
    .leftJoinAndSelect("order.items", "items")
    .leftJoinAndSelect("items.menuItem", "menuItem");

  if (status) {
    queryBuilder.andWhere("order.orderStatus = :status", { status });
  }

  if (startDate) {
    queryBuilder.andWhere("order.createdAt >= :startDate", { startDate });
  }

  if (endDate) {
    queryBuilder.andWhere("order.createdAt <= :endDate", { endDate });
  }

  queryBuilder
    .orderBy("order.createdAt", "DESC")
    .skip(skip)
    .take(limit);

  return await queryBuilder.getManyAndCount();
};

// 4. Find incoming orders for Kitchen Staff (FIFO queue: oldest first)
const findStaffOrders = async ({ page = 1, limit = 20, status }) => {
  const skip = (page - 1) * limit;

  const queryBuilder = orderRepository
    .createQueryBuilder("order")
    .leftJoinAndSelect("order.user", "user")
    .leftJoinAndSelect("order.items", "items")
    .leftJoinAndSelect("items.menuItem", "menuItem");

  if (status) {
    queryBuilder.andWhere("order.orderStatus = :status", { status });
  } else {
    // Default: Show active kitchen orders (exclude Served and Cancelled)
    queryBuilder.andWhere("order.orderStatus IN (:...statuses)", {
      statuses: [
        ORDER_STATUS.PENDING,
        ORDER_STATUS.PREPARING,
        ORDER_STATUS.PREPARED,
      ],
    });
  }

  // FIFO order for kitchen staff (oldest pending orders first)
  queryBuilder
    .orderBy("order.createdAt", "ASC")
    .skip(skip)
    .take(limit);

  return await queryBuilder.getManyAndCount();
};

// 5. Create Order Header (Inside Transaction) - Creating the Bill Header
const createOrder = async (orderData, manager = null) => {
  const repo = manager ? manager.getRepository(Order) : orderRepository;
  const newOrder = repo.create(orderData);
  return await repo.save(newOrder);
};

// 6. Bulk Insert Order Items (Inside Transaction)
const createOrderItems = async (itemsData, manager = null) => {
  const repo = manager ? manager.getRepository(OrderItem) : orderItemRepository;
  const items = repo.create(itemsData);
  return await repo.save(items);
};

// 7. Update Order Status
const updateOrderStatus = async (orderId, newStatus, manager = null) => {
  const repo = manager ? manager.getRepository(Order) : orderRepository;
  await repo.update(orderId, { orderStatus: newStatus });
  return await findOrderById(orderId, manager);
};

module.exports = {
  findOrderById,
  findUserOrders,
  findAllOrders,
  findStaffOrders,
  createOrder,
  createOrderItems,
  updateOrderStatus,
};
