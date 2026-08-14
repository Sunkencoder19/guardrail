import "dotenv/config";

process.env.NODE_ENV = "test";

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { connectTestDb, clearCollections, disconnectTestDb } from "./dbHelper.js";

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearCollections("users");
});

afterAll(async () => {
  await disconnectTestDb();
});

const credentials = {
  name: "Smoke Test User",
  email: "smoke-test@example.com",
  password: "password123",
};

describe("auth flow", () => {
  it("registers a new user without leaking the password hash", async () => {
    const res = await request(app).post("/api/users/register").send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.data.password).toBeUndefined();
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/users/register").send(credentials);

    const res = await request(app).post("/api/users/register").send(credentials);

    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than the policy minimum", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ ...credentials, password: "short" });

    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials and returns a token", async () => {
    await request(app).post("/api/users/register").send(credentials);

    const res = await request(app)
      .post("/api/users/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });

  it("rejects login with the wrong password", async () => {
    await request(app).post("/api/users/register").send(credentials);

    const res = await request(app)
      .post("/api/users/login")
      .send({ email: credentials.email, password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("rejects a protected route with no token", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
  });

  // Regression test: a malformed JWT used to fall through to a generic 500
  // instead of a 401 (see auth.middleware.js).
  it("rejects a protected route with a malformed token as 401, not 500", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer not-a-real-token");

    expect(res.status).toBe(401);
  });

  it("allows a protected route with a valid token", async () => {
    await request(app).post("/api/users/register").send(credentials);

    const loginRes = await request(app)
      .post("/api/users/login")
      .send({ email: credentials.email, password: credentials.password });

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(credentials.email);
  });
});
