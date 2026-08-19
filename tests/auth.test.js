const request = require("supertest");
const app = require("../src/app");
const AppDataSource = require("../src/database/data-source");

// Setup & Teardown: Open DB connection before tests, close after tests
beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe(" Auth Module Integration Tests", () => {
  // Use a unique email and fullName for each test run
  const testUser = {
    fullName: "Test Runner",
    email: `test_${Date.now()}@example.com`,
    password: "Password123",
    phone: "98" + Math.floor(10000000 + Math.random() * 90000000), 
  };

  let accessToken = "";

  // Test 1: Register Customer
  it("should register a new customer successfully (201)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sanitizedUser.email).toBe(testUser.email);
    expect(res.body.data.sanitizedUser.password).toBeUndefined(); // Security check: no password leak
  });

  // Test 2: Reject Duplicate Email
  it("should reject registration with duplicate email (400)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 3: Login Customer
  it("should login customer with valid credentials and return access token (200)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    // Save token for next tests
    accessToken = res.body.data.accessToken;
  });

  // Test 4: Reject Invalid Password
  it("should reject login with incorrect password (400)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: "WrongPassword999",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 5: Get Logged-in Profile (Protected Route)
  it("should fetch logged-in user profile using Bearer token (200)", async () => {
    const res = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
  });

  // Test 6: Reject Profile Access without Token (401)
  it("should reject profile request without token (401)", async () => {
    const res = await request(app).get("/api/v1/auth/profile");

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});


/**
 *  Auth Module Integration Tests Summary:
 * 
 * 1. Customer Registration (201) -> Creates new user, hashes password, returns sanitized user.
 * 2. Duplicate Email Check (400) -> Rejects duplicate email to prevent account conflicts.
 * 3. Customer Login (200) -> Authenticates credentials, generates JWT access & refresh tokens.
 * 4. Invalid Password Check (400) -> Rejects incorrect password with generic security message.
 * 5. Get Profile with Bearer Token (200) -> Verifies JWT auth middleware and loads user data.
 * 6. Unauthorized Access Check (401) -> Rejects protected profile request when token is missing.
 */
