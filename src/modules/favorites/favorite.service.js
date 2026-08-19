const favoriteRepository = require("./favorite.repository");
const menuRepository = require("../menu/menu.repository");

// Helper: Format favorite dish for clean API output
const formatFavorite = (fav) => {
  if (!fav) return null;

  return {
    id: fav.id,
    userId: fav.userId,
    createdAt: fav.createdAt,
    menuItem: fav.menuItem
      ? {
          id: fav.menuItem.id,
          name: fav.menuItem.name,
          description: fav.menuItem.description,
          price: Number(fav.menuItem.price),
          imageUrl: fav.menuItem.imageUrl,
          isVeg: fav.menuItem.isVeg,
          isAvailable: fav.menuItem.isAvailable,
          category: fav.menuItem.category
            ? {
                id: fav.menuItem.category.id,
                name: fav.menuItem.category.name,
              }
            : null,
        }
      : null,
  };
};

// 1. Add dish to favorites
const addFavorite = async (userId, menuItemId) => {
  // Step 1: Verify menu item exists
  const menuItem = await menuRepository.findMenuItemById(menuItemId);
  if (!menuItem) {
    throw new Error("Menu item not found");
  }

  // Step 2: Check if already in favorites
  const existing = await favoriteRepository.findFavorite(userId, menuItemId);
  if (existing) {
    throw new Error("Dish is already in your favorites");
  }

  const newFav = await favoriteRepository.addFavorite(userId, menuItemId);
  newFav.menuItem = menuItem;
  return formatFavorite(newFav);
};

// 2. Remove dish from favorites
const removeFavorite = async (userId, menuItemId) => {
  const existing = await favoriteRepository.findFavorite(userId, menuItemId);
  if (!existing) {
    throw new Error("Favorite not found");
  }

  await favoriteRepository.removeFavorite(userId, menuItemId);
  return { message: "Dish removed from favorites successfully" };
};

// 3. Get customer's favorite dishes list (Paginated)
const getUserFavorites = async (userId, queryParams = {}) => {
  const cleanQuery = {};
  Object.keys(queryParams).forEach((key) => {
    cleanQuery[key.trim()] = queryParams[key];
  });

  const page = Math.max(1, Number(cleanQuery.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(cleanQuery.limit) || 10));

  const [favorites, total] = await favoriteRepository.findUserFavorites(userId, {
    page,
    limit,
  });

  return {
    favorites: favorites.map(formatFavorite),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = {
  addFavorite,
  removeFavorite,
  getUserFavorites,
};
