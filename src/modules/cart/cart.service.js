const cartRepository = require("./cart.repository");
const menuRepository = require("../menu/menu.repository");


// The service layer is the brain of the cart. It ensures:
// Customers cannot add out-of-stock items.
// Prices and subtotals are calculated accurately on the backend (never trusting frontend calculations).
// Security: A user can never modify or delete someone else’s cart items.
// Adding an existing item increases its quantity instead of creating duplicates.

// Helper: Format cart response with subtotals and grand total
const formatCartResponse = (cart) => {
  if (!cart) return null;
  // Give the cart items. If there are no items, give an empty list.
  const items = (cart.items || []).map((item) => {
    const unitPrice = item.menuItem ? Number(item.menuItem.price) : 0;
    const subtotal = Number((unitPrice * item.quantity).toFixed(2)); // 2 decimal places in price 

    return {
      id: item.id,
      quantity: item.quantity,
      menuItem: item.menuItem
        ? {
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: unitPrice,
            imageUrl: item.menuItem.imageUrl,
            isVeg: item.menuItem.isVeg,
            isAvailable: item.menuItem.isAvailable,
            category: item.menuItem.category
              ? {
                  id: item.menuItem.category.id,
                  name: item.menuItem.category.name,
                }
              : null,
          }
        : null,
      subtotal,
    };
  });
  // Sum up all subtotals for the Grand Total
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  // Count total quantity of items (e.g. 2 Pizzas + 1 Coke = 3 total items)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: cart.id,
    userId: cart.userId,
    items,
    totalItems,
    totalAmount: Number(totalAmount.toFixed(2)),
  };
};

// Get or initialize current user's cart
const getCart = async (userId) => {
  let cart = await cartRepository.findCartByUserId(userId);
  if (!cart) {
    cart = await cartRepository.createCart(userId);
    cart.items = [];
  }
  return formatCartResponse(cart);
};

// Add item to cart
const addToCart = async (userId, { menuItemId, quantity = 1 }) => {
  // Step 1: Validate menu item exists and is available
  const menuItem = await menuRepository.findMenuItemById(menuItemId);
  if (!menuItem) {
    throw new Error("Menu item not found");
  }

  if (!menuItem.isAvailable) {
    throw new Error("This menu item is currently out of stock");
  }

  if (!menuItem.category || !menuItem.category.isActive) {
    throw new Error("This menu item belongs to an inactive category");
  }

  // Step 2: Get or create user's cart
  let cart = await cartRepository.findCartByUserId(userId);
  if (!cart) {
    cart = await cartRepository.createCart(userId);
  }

  // Step 3: Check if item already exists in the cart
  const existingItem = await cartRepository.findCartItem(cart.id, menuItemId);

  if (existingItem) {
    // Increment existing quantity
    const newQuantity = existingItem.quantity + Number(quantity);
    await cartRepository.updateCartItemQuantity(existingItem.id, newQuantity);
  } else {
    // Add new cart item
    await cartRepository.addCartItem(cart.id, menuItemId, Number(quantity));
  }

  // Return fresh formatted cart
  const updatedCart = await cartRepository.findCartByUserId(userId);
  return formatCartResponse(updatedCart);
};

// Update item quantity in cart
const updateCartItemQuantity = async (userId, cartItemId, quantity) => {
  const parsedQty = Number(quantity);
  if (parsedQty < 1) {
    throw new Error("Quantity must be at least 1. Use remove to delete the item.");
  }

  // Verify cart item exists
  const cartItem = await cartRepository.findCartItemById(cartItemId);
  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  // Verify ownership (security check: item belongs to user's cart)
  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart || cartItem.cartId !== cart.id) {// cartItem.cartId = John's Cart ID. // cart.id = hacker Bob's Cart ID.
    throw new Error("Unauthorized: This item does not belong to your cart");
  }

  // Verify menu item is still available
  if (cartItem.menuItem && !cartItem.menuItem.isAvailable) {
    throw new Error("This menu item is currently out of stock");
  }

  await cartRepository.updateCartItemQuantity(cartItemId, parsedQty);

  const updatedCart = await cartRepository.findCartByUserId(userId);
  return formatCartResponse(updatedCart);
};

// Remove a single item from cart
const removeCartItem = async (userId, cartItemId) => {
  const cartItem = await cartRepository.findCartItemById(cartItemId);
  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  // Verify ownership
  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart || cartItem.cartId !== cart.id) {  // cartItem.cartId = John's Cart ID. // cart.id = hacker Bob's Cart ID.
    throw new Error("Unauthorized: This item does not belong to your cart");
  }

  await cartRepository.removeCartItem(cartItemId);

  const updatedCart = await cartRepository.findCartByUserId(userId);
  return formatCartResponse(updatedCart);
};

// Clear all items from cart
const clearCart = async (userId) => {
  let cart = await cartRepository.findCartByUserId(userId);
  if (!cart) {
    cart = await cartRepository.createCart(userId);
  } else {
    await cartRepository.clearCart(cart.id);
  }

  const updatedCart = await cartRepository.findCartByUserId(userId);
  return formatCartResponse(updatedCart);
};

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
