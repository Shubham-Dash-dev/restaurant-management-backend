const notificationRepository = require("./notification.repository");

// Helper: Format notification for clean API responses
const formatNotification = (notification) => {
  if (!notification) return null;

  return {
    id: notification.id,
    userId: notification.userId,
    orderId: notification.orderId,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    order: notification.order
      ? {
          id: notification.order.id,
          orderStatus: notification.order.orderStatus,
          totalAmount: Number(notification.order.totalAmount),
        }
      : null,
  };
};

// 1. Create a notification (Internal helper called by Order events)
const createNotification = async ({ userId, orderId = null, title, message }, manager = null) => {
  const notification = await notificationRepository.createNotification(
    {
      userId,
      orderId,
      title,
      message,
      isRead: false,
    },
    manager
  );
  return formatNotification(notification);
};

// 2. Get logged-in user's notification list with unread count
const getUserNotifications = async (userId, queryParams = {}) => {
  const cleanQuery = {};
  Object.keys(queryParams).forEach((key) => {
    cleanQuery[key.trim()] = queryParams[key];
  });

  const page = Math.max(1, Number(cleanQuery.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(cleanQuery.limit) || 10));

  const [notifications, total] = await notificationRepository.findUserNotifications(
    userId,
    {
      page,
      limit,
      isRead: cleanQuery.isRead,
    }
  );

  const unreadCount = await notificationRepository.countUnread(userId);

  return {
    unreadCount,
    notifications: notifications.map(formatNotification),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// 3. Get single notification details (with user ownership security check)
const getNotificationById = async (id, userId) => {
  const notification = await notificationRepository.findNotificationById(id);
  if (!notification) {
    throw new Error("Notification not found");
  }

  // Security: Prevent accessing another user's notifications
  if (notification.userId !== userId) {
    throw new Error("Unauthorized: You do not have permission to view this notification");
  }

  return formatNotification(notification);
};

// 4. Mark single notification as read
const markAsRead = async (id, userId) => {
  const notification = await notificationRepository.findNotificationById(id);
  if (!notification) {
    throw new Error("Notification not found");
  }

  // Security check
  if (notification.userId !== userId) {
    throw new Error("Unauthorized: You do not have permission to update this notification");
  }

  const updated = await notificationRepository.markAsRead(id);
  return formatNotification(updated);
};

// 5. Mark ALL unread notifications as read
const markAllAsRead = async (userId) => {
  await notificationRepository.markAllAsRead(userId);
  return { message: "All notifications marked as read" };
};

// 6. Delete single notification
const deleteNotification = async (id, userId) => {
  const notification = await notificationRepository.findNotificationById(id);
  if (!notification) {
    throw new Error("Notification not found");
  }

  // Security check
  if (notification.userId !== userId) {
    throw new Error("Unauthorized: You do not have permission to delete this notification");
  }

  await notificationRepository.deleteNotification(id);
  return { id, message: "Notification deleted successfully" };
};

module.exports = {
  createNotification,
  getUserNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
