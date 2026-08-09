import request from "supertest";
import { app } from "../server.js";
import { pool } from "../config/database.js";

// eslint-disable-next-line no-undef
beforeAll(async () => {
  await pool.query(`
    CREATE TABLE users(
      id serial primary key,
      email varchar(255) unique not null,
      password varchar(60) not null,
      created_at timestamp default current_timestamp
    )
    `);

  await pool.query(`
    CREATE TABLE refresh_token(
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )
    `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT false,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});

let cookies;

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE tasks RESTART IDENTITY CASCADE");
  await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
  await pool.query("TRUNCATE TABLE refresh_token RESTART IDENTITY CASCADE");

  const registerRes = await request(app).post("/api/user/register").send({
    email: "test@test.com",
    password: "Test123$",
    confirmPassword: "Test123$",
  });

  cookies = registerRes.headers["set-cookie"];
});

// eslint-disable-next-line no-undef
afterAll(async () => {
  await pool.query("DROP TABLE IF EXISTS users CASCADE");
  await pool.query("DROP TABLE IF EXISTS tasks");
  await pool.query("DROP TABLE IF EXISTS refresh_token");
  await pool.end();
});

describe("POST /api/user/register", () => {
  it("Register user and returns 201 status ", async () => {
    const res = await request(app).post("/api/user/register").send({
      email: "test1@test.com",
      password: "Test123$",
      confirmPassword: "Test123$",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
    expect(res.body.user).toEqual({
      id: 2,
      email: "test1@test.com",
    });

    const cookie = res.header["set-cookie"];

    expect(cookie).toBeDefined();

    const hasAccessToken = cookie.some((c) => c.startsWith("accessToken="));
    const hasRefreshToken = cookie.some((c) => c.startsWith("refreshToken="));

    expect(hasAccessToken).toBe(true);
    expect(hasRefreshToken).toBe(true);
  });

  it("Returns 400 status on missing registration data", async () => {
    const res = await request(app).post("/api/user/register").send({
      email: "",
      password: "",
      confirmPassword: "",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("No data provided");
  });

  it("Returns 400 status on invalid email", async () => {
    const res = await request(app).post("/api/user/register").send({
      email: "test.test.com",
      password: "Test123$",
      confirmPassword: "Test123$",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Please provide a valid email");
  });

  it("Returns 400 status on invalid password", async () => {
    const res = await request(app).post("/api/user/register").send({
      email: "test@test.com",
      password: "Test123",
      confirmPassword: "Test123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Password must be 8 characters long and at least have 1 uppercase, 1 lowercase, 1 number, and 1 special character",
    );
  });

  it("Returns 400 status on password mismatch", async () => {
    const res = await request(app).post("/api/user/register").send({
      email: "test@test.com",
      password: "Test123$",
      confirmPassword: "Test123@",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Passwords do not match");
  });

  it("Returns 409 status on registering duplicate email", async () => {
    const res = await request(app).post("/api/user/register").send({
      email: "test@test.com",
      password: "Test123$",
      confirmPassword: "Test123$",
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("User already exists");
  });
});

describe("POST /api/user/login", () => {
  it("Returns 200 status of user logging in successfully and returns true on cookies in headers ", async () => {
    await request(app).post("/api/user/register").send({
      email: "test1@test.com",
      password: "Test123$",
      confirmPassword: "Test123$",
    });

    const res = await request(app).post("/api/user/login").send({
      email: "test1@test.com",
      password: "Test123$",
    });

    const cookie = res.header["set-cookie"];

    expect(cookie).toBeDefined();

    const hasAccessToken = cookie.some((c) => c.startsWith("accessToken="));
    const hasRefreshToken = cookie.some((c) => c.startsWith("refreshToken="));

    expect(hasAccessToken).toBe(true);
    expect(hasRefreshToken).toBe(true);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged in successfully");
    expect(res.body.user).toEqual({
      id: 2,
      email: "test1@test.com",
    });
  });

  it("Returns 400 status on missing login data", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "",
      password: "$",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Please provide credentials to log in");
  });

  it("Returns 400 status on invalid email upon logging in", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "test.test.com",
      password: "Test123$",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("Returns 400 status on invalid password upon logging in", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "test@test.com",
      password: "Test123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("Returns 400 status on password mistmatch", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "test@test.com",
      password: "Test123@",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("Returns 404 status on not found user", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "test@email.com",
      password: "Test123$",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});

describe("POST /api/user/logout", () => {
  it("Returns 200 status on successfully logged out user", async () => {
    expect(cookies).toBeDefined();

    await request(app).post("/api/user/login").set("Cookie", cookies).send({
      email: "test@test.com",
      password: "Test123$",
    });

    const res = await request(app)
      .post("/api/user/logout")
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User logged out successfully");
  });

  it("Returns 401 status on unathorized token", async () => {
    const mockToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";

    await request(app).post("/api/user/login").set("Cookie", cookies).send({
      email: "test@test.com",
      password: "Test123$",
    });

    const res = await request(app)
      .post("/api/user/logout")
      .set("Cookie", mockToken);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Not authorized, Login again.");
  });
});
