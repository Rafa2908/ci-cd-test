import request from "supertest";
import { app } from "../server.js"; // your Express app, not the server listener
import { pool } from "../config/database.js";

// eslint-disable-next-line no-undef
beforeAll(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT false
    )
  `);
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE tasks RESTART IDENTITY CASCADE");
});

// eslint-disable-next-line no-undef
afterAll(async () => {
  await pool.query("DROP TABLE IF EXISTS tasks");
  await pool.end();
});

describe("POST /api/task/add", () => {
  it("Adds a new task and returns 201", async () => {
    const res = await request(app)
      .post("/api/task/add")
      .send({ title: "Learn Jest" });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("New task added");

    const dbCheck = await pool.query(
      `
      SELECT id FROM tasks
      WHERE title=$1
      `,
      ["Learn Jest"],
    );

    expect(dbCheck.rowCount).toBe(1);
  });

  it("Returns 400 status on empty data provided", async () => {
    const res = await request(app).post("/api/task/add").send({ title: "" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("No data provided");

    const dbCheck = await pool.query("SELECT id FROM tasks");
    expect(dbCheck.rowCount).toBe(0);
  });
});

describe("GET /api/task/tasks", () => {
  it("Returns tasks and 200 success status", async () => {
    await request(app).post("/api/task/add").send({ title: "Learn Jest" });

    const res = await request(app).get("/api/task/tasks");

    expect(res.statusCode).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].id).toBe(1);
    expect(res.body.tasks[0].completed).toBe(false);
  });

  it("Returns empty array and 200 success status on empty tasks", async () => {
    const res = await request(app).get("/api/task/tasks");

    expect(res.statusCode).toBe(200);
    expect(res.body.tasks).toEqual([]);
  });
});

describe("GET /api/task/:id", () => {
  it("Returns task by id and 200 success status", async () => {
    await request(app).post("/api/task/add").send({ title: "Learn Jest" });

    const res = await request(app).get("/api/task/1");

    expect(res.statusCode).toBe(200);
    expect(res.body.task).toEqual({
      id: 1,
      title: "Learn Jest",
      completed: false,
    });
  });

  it("Returns task not found and 404 status", async () => {
    const res = await request(app).get("/api/task/199");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Task not found");
  });
});

describe("GET /api/task/search?completed=true", () => {
  it("Returns 404 status on not completed tasks", async () => {
    await request(app).post("/api/task/add").send({ title: "Learn Jest" });

    const res = await request(app).get("/api/task/search?completed=true");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Tasks not found");
  });
});

describe("PUT /api/task/:id/title", () => {
  it("Update task and returns 200 success status", async () => {
    await request(app).post("/api/task/add").send({ title: "Learn Jest" });

    const res = await request(app)
      .put("/api/task/1/title")
      .send({ title: "Learn CI/CD" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Task updated");
  });

  it("Returns 400 status on invalid id", async () => {
    const res = await request(app)
      .put("/api/task/abc/title")
      .send({ title: "Learn CI" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid data provided");
  });

  it("Returns 400 status on empty title body ", async () => {
    const res = await request(app).put("/api/task/1/title").send({ title: "" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("No data provided");
  });

  it("Returns 404 status on not found task", async () => {
    const res = await request(app)
      .put("/api/task/12/title")
      .send({ title: "Learn CI/CD" });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No task found to update");
  });
});

describe("DELETE /api/task/:id", () => {
  it("Delete existing task and GET follow-up", async () => {
    await request(app).post("/api/task/add").send({ title: "Learn Docker" });

    const res = await request(app).delete("/api/task/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Task deleted");

    const getRes = await request(app).get("/api/task/1");
    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.message).toBe("Task not found");
  });

  it("Returns 404 status on not found task", async () => {
    const res = await request(app).delete("/api/task/126");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No task found to delete");
  });

  it("Returns 400 status on invalid id", async () => {
    const res = await request(app).delete("/api/task/abc");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid data provided");
  });
});

describe("PUT /api/task/:id/status", () => {
  it("Returns 400 status on invalid id", async () => {
    const res = await request(app).put("/api/task/abc/status");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid data provided");
  });

  it("Returns 404 status on not found task ", async () => {
    const res = await request(app).put("/api/task/12/status");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No task found to complete");
  });

  it("Returns 200 status on TRUE completed task & follow-up GET", async () => {
    await request(app).post("/api/task/add").send({ title: "Learn Docker" });

    const res = await request(app).put("/api/task/1/status");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Task completed");

    const getRes = await request(app).get("/api/task/1");

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.task).toEqual({
      id: 1,
      title: "Learn Docker",
      completed: true,
    });
  });

  it("Returns 200 status on FALSE completed task & follow-up GET", async () => {
    await request(app).post("/api/task/add").send({ title: "Learn Docker" });
    await request(app).put("/api/task/1/status");

    const res = await request(app).put("/api/task/1/status");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Task completed");

    const getRes = await request(app).get("/api/task/1");

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.task).toEqual({
      id: 1,
      title: "Learn Docker",
      completed: false,
    });
  });
});
