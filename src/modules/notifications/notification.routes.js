const express = require("express");
const router = express.Router();
const notificationController = require("./notification.controller");
const { protect } = require("../../middlewares/auth.middleware");
const validateUUID = require("../../middlewares/uuid.middleware");

// All notification routes require user to be logged in
router.use(protect);

// 1. Get user's notifications list (supports ?isRead=false & pagination)
router.get("/", notificationController.getUserNotifications);

// 2. Mark ALL notifications as read (Must be above /:id)
router.patch("/read-all", notificationController.markAllAsRead);

// 3. Get single notification details
router.get("/:id", validateUUID, notificationController.getNotificationById);

// 4. Mark single notification as read
router.patch("/:id/read", validateUUID, notificationController.markAsRead);

// 5. Delete a notification
router.delete("/:id", validateUUID, notificationController.deleteNotification);

module.exports = router;
