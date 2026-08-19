const express = require("express");
const router = express.Router();
const favoriteController = require("./favorite.controller");
const { protect, restrictTo } = require("../../middlewares/auth.middleware");
const validateUUID = require("../../middlewares/uuid.middleware");

// All favorites routes require logged-in Customer
router.use(protect);
router.use(restrictTo("CUSTOMER"));

// Get customer's favorite dishes
router.get("/", favoriteController.getUserFavorites);

// Add dish to favorites
router.post("/:menuItemId", validateUUID, favoriteController.addFavorite);

// Remove dish from favorites
router.delete("/:menuItemId", validateUUID, favoriteController.removeFavorite);

module.exports = router;
