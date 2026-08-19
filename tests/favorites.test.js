const request = require("supertest");
const app = require("../src/app");
const AppDataSource = require("../src/database/data-source");
const userRepository = require("../src/modules/users/user.repository");
const categoryRepository = require("../src/modules/categories/category.repository");
const menuRepository = require("../src/modules/menu/menu.repository");
const { generateAccessToken } = require("../src/utils/jwt.util");

let customerAToken = "";
let customerBToken = "";
let dishId = "";

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  // 1. Create Customer A
  const customerA = await userRepository.createNewUser({
    fullName: "Favorite Fan A",
    email: `favA_${Date.now()}@test.com`,
    password: "Password123",
    phone: "95" + Math.floor(10000000 + Math.random() * 90000000),
    role: "CUSTOMER",
  });
  customerAToken = generateAccessToken({ id: customerA.id, role: customerA.role });

  // 2. Create Customer B
  const customerB = await userRepository.createNewUser({
    fullName: "Favorite Fan B",
    email: `favB_${Date.now()}@test.com`,
    password: "Password123",
    phone: "96" + Math.floor(10000000 + Math.random() * 90000000),
    role: "CUSTOMER",
  });
  customerBToken = generateAccessToken({ id: customerB.id, role: customerB.role });

  // 3. Create Category & Dish
  const category = await categoryRepository.createCategory({
    name: `Tandoor_${Date.now()}`,
    isActive: true,
  });

  const dish = await menuRepository.createMenuItem({
    name: `Paneer Tikka_${Date.now()}`,
    price: 220.00,
    isAvailable: true,
    categoryId: category.id,
  });
  dishId = dish.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe("Customer Favorites Integration Tests", () => {

  // Test 1: Add Dish to Favorites
  it("should add dish to customer favorites (201)", async () => {
    const res = await request(app)
      .post(`/api/v1/favorites/${dishId}`)
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.menuItem.id).toBe(dishId);
    expect(Number(res.body.data.menuItem.price)).toBe(220.00);
  });

  // Test 2: Reject Adding Same Dish Twice
  it("should reject adding the same dish to favorites twice (400)", async () => {
    const res = await request(app)
      .post(`/api/v1/favorites/${dishId}`)
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 3: Reject Non-Existent Dish
  it("should reject favoriting a non-existent dish (404)", async () => {
    const fakeUUID = "11111111-1111-1111-1111-111111111111";
    const res = await request(app)
      .post(`/api/v1/favorites/${fakeUUID}`)
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // Test 4: Get Customer A's Favorites List
  it("should fetch customer A's favorites list (200)", async () => {
    const res = await request(app)
      .get("/api/v1/favorites")
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.favorites.length).toBe(1);
    expect(res.body.data.favorites[0].menuItem.id).toBe(dishId);
  });

  // Test 5: Customer B has empty favorites (Privacy Check)
  it("should verify Customer B sees empty favorites list (200)", async () => {
    const res = await request(app)
      .get("/api/v1/favorites")
      .set("Authorization", `Bearer ${customerBToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.favorites).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  // Test 6: Remove Dish from Favorites
  it("should remove dish from customer favorites (200)", async () => {
    const res = await request(app)
      .delete(`/api/v1/favorites/${dishId}`)
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Test 7: Reject Removing Non-Existent Favorite
  it("should reject removing a dish not in favorites (404)", async () => {
    const res = await request(app)
      .delete(`/api/v1/favorites/${dishId}`)
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});


/**
 *  Customer Favorites Integration Tests Summary:
 * 
 * 1. Add Dish to Favorites (201) -> Adds dish to user's favorites list with details.
 * 2. Duplicate Favorite Rejection (400) -> Cannot favorite the same dish twice.
 * 3. Non-existent Dish Rejection (404) -> Cannot favorite a dish that doesn't exist.
 * 4. Get Customer's Favorites (200) -> Returns paginated list with dish & category details.
 * 5. Customer Privacy Isolation (200) -> Customer B cannot see Customer A's favorites.
 * 6. Remove Dish from Favorites (200) -> Removes dish from favorites list.
 * 7. Remove Non-existent Favorite (404) -> Rejects removing dish not in favorites.
 */