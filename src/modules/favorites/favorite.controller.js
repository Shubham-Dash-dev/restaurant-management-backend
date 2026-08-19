const favoriteService = require("./favorite.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");

// 1. Add dish to favorites
module.exports.addFavorite = async (req, res, next) => {
  try {
    const favorite = await favoriteService.addFavorite(
      req.user.id,
      req.params.menuItemId
    );
    return sendSuccess(res, 201, "Dish added to favorites", favorite);
  } catch (error) {
    const statusCode = error.message === "Menu item not found" ? 404 : 400;
    return sendError(res, statusCode, error.message, error);
  }
};

// 2. Remove dish from favorites
module.exports.removeFavorite = async (req, res, next) => {
  try {
    const result = await favoriteService.removeFavorite(
      req.user.id,
      req.params.menuItemId
    );
    return sendSuccess(res, 200, result.message);
  } catch (error) {
    const statusCode = error.message === "Favorite not found" ? 404 : 400;
    return sendError(res, statusCode, error.message, error);
  }
};

// 3. Get customer's favorite dishes list
module.exports.getUserFavorites = async (req, res, next) => {
  try {
    const result = await favoriteService.getUserFavorites(
      req.user.id,
      req.query
    );
    return sendSuccess(res, 200, "Favorites fetched successfully", result);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};
