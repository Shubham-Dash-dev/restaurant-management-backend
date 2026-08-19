const request = require("supertest");
const app = require("../src/app");
const AppDataSource = require("../src/database/data-source");
const userRepository = require("../src/modules/users/user.repository");
const { generateAccessToken } = require("../src/utils/jwt.util");

let adminToken = "";
let customerToken = "";
let categoryId = "";
let menuItemId = "";

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  // Create an Admin user for tests
  const adminUser = await userRepository.createNewUser({
    fullName: "Admin Test",
    email: `admin_${Date.now()}@test.com`,
    password: "Password123",
    role: "ADMIN",
  });
  adminToken = generateAccessToken({ id: adminUser.id, role: adminUser.role });

  // Create a Customer user for permission tests
  const customerUser = await userRepository.createNewUser({
    fullName: "Customer Test",
    email: `customer_${Date.now()}@test.com`,
    password: "Password123",
    role: "CUSTOMER",
  });
  customerToken = generateAccessToken({ id: customerUser.id, role: customerUser.role });
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe(" Category & Menu Items Integration Tests", () => {
  const categoryName = `Italian_${Date.now()}`;
  const dishName = `Margherita_${Date.now()}`;

  // Test 1: Admin creates a Category
  it("should allow Admin to create a category (201)", async () => {
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: categoryName,
        description: "Fresh pasta and pizzas",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(categoryName);

    categoryId = res.body.data.id;
  });

  // Test 2: Reject Duplicate Category Name
  it("should reject duplicate category name (400)", async () => {
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: categoryName,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 3: Public can view all active categories
  it("should allow public guests to view categories (200)", async () => {
    const res = await request(app).get("/api/v1/categories");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // Test 4: Customer cannot create a Menu Item (403 Forbidden)
  it("should forbid Customer from creating menu items (403)", async () => {
    const res = await request(app)
      .post("/api/v1/menu")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        name: dishName,
        price: 299.00,
        categoryId,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Test 5: Admin creates a Menu Item
  it("should allow Admin to create a menu item with category relation (201)", async () => {
    const res = await request(app)
      .post("/api/v1/menu")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: dishName,
        description: "Classic cheese pizza",
        price: 299.00,
        isVeg: true,
        isAvailable: true,
        categoryId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(dishName);
    expect(Number(res.body.data.price)).toBe(299.00);
    expect(res.body.data.category).toBeDefined(); // Relation check

    menuItemId = res.body.data.id;
  });

  // Test 6: Duplicate dish name in the same category (400)
  it("should reject duplicate dish name in same category (400)", async () => {
    const res = await request(app)
      .post("/api/v1/menu")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: dishName,
        price: 350.00,
        categoryId,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 7: Public Search & Filter
  it("should search and filter menu items (200)", async () => {
    const res = await request(app)
      .get(`/api/v1/menu?search=${dishName}&categoryId=${categoryId}&sort=price`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
  });

  // Test 8: Kitchen Out-of-Stock Toggle
  it("should allow Admin/Staff to toggle dish availability (200)", async () => {
    const res = await request(app)
      .patch(`/api/v1/menu/${menuItemId}/toggle-availability`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.isAvailable).toBe(false); // Out of stock!
  });

  // Test 9: Public does NOT see out-of-stock items, but Admin DOES
  it("should hide out-of-stock dishes from public but show to Admin", async () => {
    // 1. Public guest check (Hidden)
    const publicRes = await request(app).get(`/api/v1/menu?search=${dishName}`);
    const foundInPublic = publicRes.body.data.items.find((i) => i.id === menuItemId);
    expect(foundInPublic).toBeUndefined(); // Customer cannot see it

    // 2. Admin check (Visible)
    const adminRes = await request(app)
      .get(`/api/v1/menu?search=${dishName}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const foundInAdmin = adminRes.body.data.items.find((i) => i.id === menuItemId);
    expect(foundInAdmin).toBeDefined(); // Admin CAN see it
  });

  // Test 10: Soft Delete Menu Item
  it("should allow Admin to soft-delete menu item (200)", async () => {
    const res = await request(app)
      .delete(`/api/v1/menu/${menuItemId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});


/**
 *  Categories & Menu Items Integration Tests Summary:
 * 
 * 1. Admin creates Category (201) -> Creates new category successfully.
 * 2. Duplicate Category Check (400) -> Rejects duplicate category name.
 * 3. Public get Categories (200) -> Anyone can view active categories.
 * 4. Customer blocked from creating dish (403) -> Non-admin cannot add menu items.
 * 5. Admin creates Menu Item (201) -> Creates dish linked to Category with price and relations.
 * 6. Duplicate dish in same Category (400) -> Rejects same dish name within one category.
 * 7. Public search, sort & filter (200) -> Tests ILIKE search, category filter, price sort.
 * 8. Kitchen availability toggle (200) -> Toggles dish between in-stock and out-of-stock.
 * 9. Out-of-stock visibility rule (200) -> Public sees only available dishes, Admin sees all.
 * 10. Delete Menu Item (200) -> Soft deletes the menu item.
 */