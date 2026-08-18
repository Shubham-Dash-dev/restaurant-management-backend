const AppDataSource = require("../../database/data-source");
const Notification = require("./notification.entity");

const notificationRepository = AppDataSource.getRepository(Notification);

// 1. Create a new notification (supports optional transaction manager)
const createNotification = async (notificationData, manager = null) => {
  const repo = manager ? manager.getRepository(Notification) : notificationRepository;
  const notification = repo.create(notificationData);
  return await repo.save(notification);
};

// 2. Find paginated notifications for a user (newest first, optional ?isRead filter)
const findUserNotifications = async (userId, { page = 1, limit = 10, isRead }) => {
  const skip = (page - 1) * limit;

  const queryBuilder = notificationRepository
    .createQueryBuilder("notification")
    .leftJoinAndSelect("notification.order", "order")
    .where("notification.userId = :userId", { userId });

  if (isRead !== undefined) {
    queryBuilder.andWhere("notification.isRead = :isRead", {
      isRead: isRead === "true" || isRead === true,
    });
  }

  queryBuilder
    .orderBy("notification.createdAt", "DESC")
    .skip(skip)
    .take(limit);

  return await queryBuilder.getManyAndCount();
};

// 3. Find single notification by ID
const findNotificationById = async (id) => {
  return await notificationRepository.findOne({
    where: { id },
    relations: {
      order: true,
    },
  });
};

// 4. Mark single notification as read
const markAsRead = async (id) => {
  await notificationRepository.update(id, { isRead: true });
  return await findNotificationById(id);
};

// 5. Mark ALL unread notifications as read for a user
const markAllAsRead = async (userId) => {
  return await notificationRepository.update(
    { userId, isRead: false },
    { isRead: true }
  );
};

// 6. Delete a notification
const deleteNotification = async (id) => {
  return await notificationRepository.delete(id);
};

// 7. Count unread notifications for a user
const countUnread = async (userId) => {
  return await notificationRepository.count({
    where: { userId, isRead: false },
  });
};

module.exports = {
  createNotification,
  findUserNotifications,
  findNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  countUnread,
};
