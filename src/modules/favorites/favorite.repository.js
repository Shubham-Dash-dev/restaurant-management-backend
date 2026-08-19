const AppDataSource = require("../../database/data-source");
const Favorite = require("./favorite.entity");

const favoriteRepository = AppDataSource.getRepository(Favorite);

// 1. Find a single favorite entry (checks if user already favorited this dish)
const findFavorite = async (userId, menuItemId) => {
  return await favoriteRepository.findOne({
    where: { userId, menuItemId },
  });
};

// 2. Add dish to favorites
const addFavorite = async (userId, menuItemId) => {
  const newFav = favoriteRepository.create({ userId, menuItemId });
  return await favoriteRepository.save(newFav);
};

// 3. Remove dish from favorites
const removeFavorite = async (userId, menuItemId) => {
  return await favoriteRepository.delete({ userId, menuItemId });
};

// 4. Get customer's favorite dishes (with Dish & Category details joined)
const findUserFavorites = async (userId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const queryBuilder = favoriteRepository
    .createQueryBuilder("favorite")
    .leftJoinAndSelect("favorite.menuItem", "menuItem")
    .leftJoinAndSelect("menuItem.category", "category")
    .where("favorite.userId = :userId", { userId })
    .andWhere("menuItem.deletedAt IS NULL") // Filter out soft-deleted dishes
    .orderBy("favorite.createdAt", "DESC")
    .skip(skip)
    .take(limit);

  return await queryBuilder.getManyAndCount();
};

module.exports = {
  findFavorite,
  addFavorite,
  removeFavorite,
  findUserFavorites,
};
