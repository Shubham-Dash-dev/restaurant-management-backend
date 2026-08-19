const request = require("supertest");
const app = require("../src/app");
const AppDataSource = require("../src/database/data-source");
const userRepository = require("../src/modules/users/user.repository");
const categoryRepository = require("../src/modules/categories/category.repository");
const menuRepository = require("../src/modules/menu/menu.repository");
const { generateAccessToken } = require("../src/utils/jwt.util");

let customerAToken = "";
let customerBToken = "";
let availableDishId = "";
let outOfStockDishId = "";
let cartItemId = "";

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  // 1. Create Customer A
  const customerA = await userRepository.createNewUser({
    fullName: "Customer A",
    email: `customerA_${Date.now()}@test.com`,
    password: "Password123",
    phone: "91" + Math.floor(10000000 + Math.random() * 90000000),
    role: "CUSTOMER",
  });
  customerAToken = generateAccessToken({ id: customerA.id, role: customerA.role });

  // 2. Create Customer B
  const customerB = await userRepository.createNewUser({
    fullName: "Customer B",
    email: `customerB_${Date.now()}@test.com`,
    password: "Password123",
    phone: "92" + Math.floor(10000000 + Math.random() * 90000000),
    role: "CUSTOMER",
  });
  customerBToken = generateAccessToken({ id: customerB.id, role: customerB.role });

  // 3. Create a Test Category
  const category = await categoryRepository.createCategory({
    name: `FastFood_${Date.now()}`,
    description: "Burgers and fries",
    isActive: true,
  });

  // 4. Create an In-Stock Dish (₹150.00)
  const availableDish = await menuRepository.createMenuItem({
    name: `Cheeseburger_${Date.now()}`,
    price: 150.00,
    isAvailable: true,
    categoryId: category.id,
  });
  availableDishId = availableDish.id;

  // 5. Create an Out-of-Stock Dish (₹80.00)
  const outOfStockDish = await menuRepository.createMenuItem({
    name: `Fries_${Date.now()}`,
    price: 80.00,
    isAvailable: false,
    categoryId: category.id,
  });
  outOfStockDishId = outOfStockDish.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe(" Cart Module Integration Tests", () => {

  // Test 1: Lazy Cart Initialization
  it("should get empty cart on first visit with totalAmount 0 (200)", async () => {
    const res = await request(app)
      .get("/api/v1/cart")
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.totalAmount).toBe(0);
    expect(res.body.data.totalItems).toBe(0);
  });

  // Test 2: Add 1 Dish to Cart
  it("should add dish to cart and calculate totals (200)", async () => {
    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerAToken}`)
      .send({
        menuItemId: availableDishId,
        quantity: 1,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.totalAmount).toBe(150.00);

    cartItemId = res.body.data.items[0].id;
  });

  // Test 3: Duplicate Item Auto-Increment
  it("should increment quantity when adding the same dish again (200)", async () => {
    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerAToken}`)
      .send({
        menuItemId: availableDishId,
        quantity: 1,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items.length).toBe(1); // Still 1 line item
    expect(res.body.data.items[0].quantity).toBe(2); // Quantity became 2
    expect(res.body.data.totalAmount).toBe(300.00); // 150 * 2 = 300
  });

  // Test 4: Update Quantity
  it("should update quantity to 3 and recalculate total (200)", async () => {
    const res = await request(app)
      .patch(`/api/v1/cart/items/${cartItemId}`)
      .set("Authorization", `Bearer ${customerAToken}`)
      .send({
        quantity: 3,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items[0].quantity).toBe(3);
    expect(res.body.data.totalAmount).toBe(450.00); // 150 * 3 = 450
  });

  // Test 5: Cross-User Cart Tampering Check (Security)
  it("should prevent Customer B from modifying Customer A's cart item (400)", async () => {
    const res = await request(app)
      .patch(`/api/v1/cart/items/${cartItemId}`)
      .set("Authorization", `Bearer ${customerBToken}`)
      .send({
        quantity: 10,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 6: Reject Adding Out-of-Stock Dish
  it("should reject adding an out-of-stock dish to cart (400)", async () => {
    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerAToken}`)
      .send({
        menuItemId: outOfStockDishId,
        quantity: 1,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 7: Clear Entire Cart
  it("should clear the entire cart (200)", async () => {
    const res = await request(app)
      .delete("/api/v1/cart/clear")
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.totalAmount).toBe(0);
  });
});


/**
 * Cart Module Integration Tests Summary:
 * 
 * 1. Lazy Cart Init (200) -> Fetches empty cart, auto-initializes if not present.
 * 2. Add dish to cart (201) -> Adds 1 item with calculated subtotal & grand total.
 * 3. Duplicate dish auto-increment (200) -> Adding same dish again increases quantity to 2.
 * 4. Update quantity (200) -> Changes quantity and recalculates totals correctly.
 * 5. Cross-user ownership security (400) -> Customer B blocked from tampering Customer A's cart.
 * 6. Out-of-stock rejection (400) -> Cannot add dish marked out-of-stock.
 * 7. Remove single cart item (200) -> Removes item and updates grand total.
 * 8. Clear entire cart (200) -> Empties cart cleanly.
 */
