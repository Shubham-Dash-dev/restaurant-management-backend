const notificationService = require("./notification.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");

// 1. Get logged-in user's notifications (with unreadCount and pagination)
module.exports.getUserNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(
      req.user.id,
      req.query
    );
    return sendSuccess(
      res,
      200,
      "Notifications fetched successfully",
      result
    );
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 2. Get single notification details by ID
module.exports.getNotificationById = async (req, res, next) => {
  try {
    const notification = await notificationService.getNotificationById(
      req.params.id,
      req.user.id
    );
    return sendSuccess(
      res,
      200,
      "Notification details fetched successfully",
      notification
    );
  } catch (error) {
    return sendError(res, 404, error.message, error);
  }
};

// 3. Mark single notification as read
module.exports.markAsRead = async (req, res, next) => {
  try {
    const updated = await notificationService.markAsRead(
      req.params.id,
      req.user.id
    );
    return sendSuccess(
      res,
      200,
      "Notification marked as read",
      updated
    );
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 4. Mark all unread notifications as read
module.exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    return sendSuccess(res, 200, result.message);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

// 5. Delete a notification
module.exports.deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(
      req.params.id,
      req.user.id
    );
    return sendSuccess(res, 200, result.message, { id: result.id });
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};
