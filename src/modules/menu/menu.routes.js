const express = require("express");
const router = express.Router();
const menuController = require("./menu.controller");
const {createMenuItemValidation,updateMenuItemValidation,} = require("./menu.validator");
const validate = require("../../middlewares/validate.middleware");
const validateUUID = require("../../middlewares/uuid.middleware");
const {protect,restrictTo,optionalAuth,} = require("../../middlewares/auth.middleware");

// Public / Mixed Routes (Guests see available dishes, Staff/Admin can view all)
router.get("/", optionalAuth, menuController.getAllMenuItems);
router.get("/:id", validateUUID, menuController.getMenuItemById);

// Protected Routes (Only ADMIN & STAFF can create/update dishes)
router.post("/",protect,restrictTo("ADMIN", "STAFF"),createMenuItemValidation,validate,menuController.createMenuItem);

router.patch("/:id",protect,restrictTo("ADMIN", "STAFF"),validateUUID,updateMenuItemValidation,validate,menuController.updateMenuItem);

// Quick Kitchen Out-of-Stock Toggle for Chefs & Staff
router.patch("/:id/toggle-availability",protect,restrictTo("ADMIN", "STAFF"),validateUUID,menuController.toggleAvailability);

// Delete Dish (Only ADMIN can delete)
router.delete("/:id",protect,restrictTo("ADMIN"),validateUUID,menuController.deleteMenuItem);

module.exports = router;
