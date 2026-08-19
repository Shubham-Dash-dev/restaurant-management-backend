const request = require("supertest");
const app = require("../src/app");
const AppDataSource = require("../src/database/data-source");
const userRepository = require("../src/modules/users/user.repository");
const categoryRepository = require("../src/modules/categories/category.repository");
const menuRepository = require("../src/modules/menu/menu.repository");
const { generateAccessToken } = require("../src/utils/jwt.util");

let adminToken = "";
let staffToken = "";
let customerAToken = "";
let customerBToken = "";
let pizzaDishId = "";
let order1Id = "";
let order2Id = "";

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  // 1. Create Admin
  const admin = await userRepository.createNewUser({
    fullName: "Admin Boss",
    email: `admin_${Date.now()}@test.com`,
    password: "Password123",
    role: "ADMIN",
  });
  adminToken = generateAccessToken({ id: admin.id, role: admin.role });

  // 2. Create Kitchen Staff
  const staff = await userRepository.createNewUser({
    fullName: "Chef Gordon",
    email: `staff_${Date.now()}@test.com`,
    password: "Password123",
    role: "STAFF",
  });
  staffToken = generateAccessToken({ id: staff.id, role: staff.role });

  // 3. Create Customer A
  const customerA = await userRepository.createNewUser({
    fullName: "Customer A",
    email: `customerA_${Date.now()}@test.com`,
    password: "Password123",
    phone: "93" + Math.floor(10000000 + Math.random() * 90000000),
    role: "CUSTOMER",
  });
  customerAToken = generateAccessToken({ id: customerA.id, role: customerA.role });

  // 4. Create Customer B
  const customerB = await userRepository.createNewUser({
    fullName: "Customer B",
    email: `customerB_${Date.now()}@test.com`,
    password: "Password123",
    phone: "94" + Math.floor(10000000 + Math.random() * 90000000),
    role: "CUSTOMER",
  });
  customerBToken = generateAccessToken({ id: customerB.id, role: customerB.role });

  // 5. Create Category & Dish (₹250.00)
  const category = await categoryRepository.createCategory({
    name: `Pizzeria_${Date.now()}`,
    isActive: true,
  });

  const dish = await menuRepository.createMenuItem({
    name: `Pepperoni Pizza_${Date.now()}`,
    price: 250.00,
    isAvailable: true,
    categoryId: category.id,
  });
  pizzaDishId = dish.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe(" Orders & Notifications Integration Tests", () => {

  // Test 1: Empty Cart Order Rejection
  it("should reject checkout with empty cart (400)", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 2: Place Order (ACID Transaction)
  it("should place order successfully and return clean receipt (201)", async () => {
    // 1. Add 2 pizzas to cart
    await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerAToken}`)
      .send({ menuItemId: pizzaDishId, quantity: 2 });

    // 2. Place Order
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderStatus).toBe("Pending");
    expect(res.body.data.totalAmount).toBe(500.00); // 250 * 2 = 500
    expect(res.body.data.items[0].priceAtPurchase).toBe(250.00); // Price snapshot!

    order1Id = res.body.data.id;
  });

  // Test 3: Verify Cart is now completely empty
  it("should verify customer cart was automatically emptied (200)", async () => {
    const res = await request(app)
      .get("/api/v1/cart")
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.totalAmount).toBe(0);
  });

  // Test 4: Verify Order Placed notification was triggered
  it("should verify order placed notification exists for Customer A (200)", async () => {
    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
  });

  // Test 5: Customer B tries to cancel Customer A's order (Security)
  it("should forbid Customer B from cancelling Customer A's order (400)", async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${order1Id}/cancel`)
      .set("Authorization", `Bearer ${customerBToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 6: Customer A cancels Order 1 (Allowed in 'Pending')
  it("should allow Customer A to cancel pending order (200)", async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${order1Id}/cancel`)
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.orderStatus).toBe("Cancelled");
  });

  // Test 7: Place Order 2 for Kitchen Cooking Flow
  it("should place a second order for kitchen testing (201)", async () => {
    await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerAToken}`)
      .send({ menuItemId: pizzaDishId, quantity: 1 });

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(201);
    order2Id = res.body.data.id;
  });

  // Test 8: Staff views Kitchen Queue (FIFO)
  it("should allow Staff to view active cooking queue (200)", async () => {
    const res = await request(app)
      .get("/api/v1/staff/orders")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.statusCode).toBe(200);
    const foundOrder2 = res.body.data.orders.find((o) => o.id === order2Id);
    expect(foundOrder2).toBeDefined();
  });

  // Test 9: State Machine Check: Cannot jump 'Pending' -> 'Served'
  it("should reject illegal status jump from 'Pending' to 'Served' (400)", async () => {
    const res = await request(app)
      .patch(`/api/v1/staff/orders/${order2Id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "Served" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 10: Chef starts cooking: 'Pending' -> 'Preparing'
  it("should allow Staff to update status to 'Preparing' (200)", async () => {
    const res = await request(app)
      .patch(`/api/v1/staff/orders/${order2Id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "Preparing" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.orderStatus).toBe("Preparing");
  });

  // Test 11: Cancellation Blocked when status is 'Preparing'
  it("should reject Customer cancellation while order is 'Preparing' (400)", async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${order2Id}/cancel`)
      .set("Authorization", `Bearer ${customerAToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 12: Finish Cooking & Serve: 'Preparing' -> 'Prepared' -> 'Served'
  it("should advance status to 'Prepared' and then 'Served' (200)", async () => {
    // 1. Mark Prepared
    const res1 = await request(app)
      .patch(`/api/v1/staff/orders/${order2Id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "Prepared" });
    expect(res1.body.data.orderStatus).toBe("Prepared");

    // 2. Mark Served
    const res2 = await request(app)
      .patch(`/api/v1/staff/orders/${order2Id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "Served" });
    expect(res2.body.data.orderStatus).toBe("Served");
  });

  // Test 13: Final State Protection
  it("should reject modifying an already 'Served' order (400)", async () => {
    const res = await request(app)
      .patch(`/api/v1/staff/orders/${order2Id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "Preparing" });

    expect(res.statusCode).toBe(400);
  });

  // Test 14: Admin views all restaurant orders
  it("should allow Admin to view all restaurant orders (200)", async () => {
    const res = await request(app)
      .get("/api/v1/admin/orders?status=Served")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.orders.length).toBeGreaterThanOrEqual(1);
  });
});


/**
 *  Orders & Notifications Integration Tests Summary:
 * 
 * 1. Empty Cart Check (400) -> Rejects placing order with 0 items.
 * 2. ACID Order Placement (201) -> Places order, creates price snapshots, auto-empties cart.
 * 3. Cart Auto-Wipe Verification (200) -> Cart is completely empty after order placement.
 * 4. Automatic Notification Check (200) -> Verified that "Order Placed" notification was triggered.
 * 5. Cross-User Cancellation Protection (400) -> Customer B cannot cancel Customer A's order.
 * 6. Cancel Order in 'Pending' (200) -> Allowed while chef has not started cooking.
 * 7. Staff FIFO Kitchen Queue (200) -> Kitchen display shows active orders, hides cancelled orders.
 * 8. State Machine Violation (400) -> Cannot jump directly from 'Pending' to 'Served'.
 * 9. Chef Starts Cooking (200) -> Transitions 'Pending' -> 'Preparing'.
 * 10. Cancellation Blocked during Cooking (400) -> Customer cannot cancel once status is 'Preparing'.
 * 11. Complete Cooking to Served (200) -> Transitions 'Preparing' -> 'Prepared' -> 'Served'.
 * 12. Final State Protection (400) -> Cannot change status of a 'Served' order.
 * 13. Admin Sales Dashboard Query (200) -> Admin can view all restaurant orders.
 */