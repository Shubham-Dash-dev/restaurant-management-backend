const AppDataSource = require("../../database/data-source");
const Cart = require("./cart.entity");
const CartItem = require("./cartItem.entity");

const cartRepository = AppDataSource.getRepository(Cart);
const cartItemRepository = AppDataSource.getRepository(CartItem);

// find cart by userId (loads items and their menuItem details)
// fetches the customer's entire cart from the database.
const findCartByUserId = async (userId) => {
  return await cartRepository.findOne({
    where: { userId },
    relations: {
      items: {
        menuItem: {
          category: true,
        },
      },
    },
    order: {
      items: {
        createdAt: "ASC",
      },
    },
  });
};

// create a new cart for user
const createCart = async (userId) => {
  const newCart = cartRepository.create({ userId });
  return await cartRepository.save(newCart);
};

//  Checks if a specific dish (e.g. Margherita Pizza) is already inside this specific cart.
// Why it is needed:
// If found ➔ The service knows: "Ah, this dish is already in the cart, so just increase its quantity (quantity + 1)".
// If not found ➔ The service knows: "This is a new dish, insert a new row".
const findCartItem = async (cartId, menuItemId) => {
  return await cartItemRepository.findOne({
    where: { cartId, menuItemId },
    relations: {
      menuItem: true,
    },
  });
};

// find cart item by its primary key id
// Why relations: { cart: true } is loaded:
// Security Check: When a user sends PATCH /cart/items/:id or DELETE /cart/items/:id, we need to check cartItem.cart.userId === req.user.id to ensure a malicious user cannot delete or change someone else's cart items!
const findCartItemById = async (cartItemId) => {
  return await cartItemRepository.findOne({
    where: { id: cartItemId },
    relations: {
      cart: true,
      menuItem: true,
    },
  });
};

// add a new item to cart
// Inserts a brand new dish row into the cart_items table with the requested quantity.
const addCartItem = async (cartId, menuItemId, quantity = 1) => {
  const item = cartItemRepository.create({
    cartId,
    menuItemId,
    quantity,
  });
  return await cartItemRepository.save(item);
};

// update quantity of a cart item
const updateCartItemQuantity = async (cartItemId, quantity) => {
  await cartItemRepository.update(cartItemId, { quantity });
  return await findCartItemById(cartItemId);
};

// remove an item from cart
const removeCartItem = async (cartItemId) => {
  return await cartItemRepository.delete(cartItemId);
};

// clear all items from a cart
const clearCart = async (cartId) => {
  return await cartItemRepository.delete({ cartId });
};

module.exports = {
  findCartByUserId,
  createCart,
  findCartItem,
  findCartItemById,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
