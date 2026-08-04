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

    // optional: verify it actually landed in the DB
    const dbCheck = await pool.query(
      `
      SELECT id FROM tasks
      WHERE title=$1
      `,
      ["Learn Jest"],
    );
    console.log(dbCheck.rows[0]);

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

  // it("Update task and returns 200 success status", async () => {
  //   await request(app).post("/api/task/add").send({ title: "Learn Jest" });

  //   const res = await request(app).put("/api/task/1");

  //   expect(res.statusCode).toBe(200);
  //   expect(res.body.message).toBe("Task completed");
  // });
});

describe("GET /api/task/search?completed=true", () => {
  it("Returns 404 status on not completed tasks", async () => {
    await request(app).post("/api/task/add").send({ title: "Learn Jest" });

    const res = await request(app).get("/api/task/search?completed=true");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Tasks not found");
  });
});

// describe("GET /api/task/tasks", () => {
//   it("Returns empty array and 404 status code", async () => {
//     const res = await request(app).get("/api/task/tasks");
//     expect(res.body.tasks).toEqual([]);
//     expect(res.statusCode).toBe(200);
//   });

//   it("Returns tasks array and success 200", async () => {
//     await request(app).post("/api/task/add").send({
//       id: "123",
//       title: "Learn Jest",
//       completed: false,
//     });
//     await request(app).post("/api/task/add").send({
//       id: "124",
//       title: "Learn CI/CD",
//       completed: false,
//     });

//     const res = await request(app).get("/api/task/tasks");
//     expect(res.body.tasks.length).toBe(2);
//     expect(res.statusCode).toBe(200);
//   });
// });

// describe("GET /api/task/:id", () => {
//   it("Returns the matching task and success 200", async () => {
//     await request(app).post("/api/task/add").send({
//       id: "123",
//       title: "Learn Jest",
//       completed: false,
//     });

//     const res = await request(app).get("/api/task/123");
//     expect(res.statusCode).toBe(200);
//     expect(res.body).toEqual({
//       id: "123",
//       title: "Learn Jest",
//       completed: false,
//     });
//   });

//   it("Returns 404 for an unknown id", async () => {
//     const res = await request(app).get("/api/task/doesnotexist");
//     expect(res.statusCode).toBe(404);
//     expect(res.body.message).toBe("No task found");
//   });
// });

// describe("POST /api/task/add", () => {
//   it("No data provided", async () => {
//     const res = await request(app).post("/api/task/add").send({
//       id: "",
//       title: "",
//       completed: undefined,
//     });
//     expect(res.body.message).toBe("No data provided");
//     expect(res.statusCode).toBe(400);
//   });

//   it("Adding new task", async () => {
//     const res = await request(app).post("/api/task/add").send({
//       id: "123",
//       title: "Learning Jest",
//       completed: false,
//     });
//     expect(res.statusCode).toBe(201);
//     expect(res.body.message).toBe("New task added");
//     expect(res.body.task).toEqual({
//       id: "123",
//       title: "Learning Jest",
//       completed: false,
//     });
//   });
// });

// describe("GET /api/task/search?completed=true", () => {
//   it("Returns 404 if no completed task found", async () => {
//     await request(app).post("/api/task/add").send(mockData);

//     const res = await request(app).get("/api/task/search?completed=false");
//     expect(res.statusCode).toBe(404);
//     expect(res.body.message).toBe("No task completed found");
//   });

//   it("Returns completed tasks and success 200", async () => {
//     await request(app).post("/api/task/add").send(mockData);
//     await request(app).post("/api/task/add").send({
//       id: "124",
//       title: "Learn CI/CD",
//       completed: true,
//     });

//     const res = await request(app).get("/api/task/search?completed=true");
//     expect(res.statusCode).toBe(200);
//     expect(res.body.tasks).toEqual([
//       { id: "124", title: "Learn CI/CD", completed: true },
//     ]);
//   });
// });

// describe("PUT /api/task/:id", () => {
//   it("Update task to true and returns the task", async () => {
//     await request(app).post("/api/task/add").send(mockData);

//     const res = await request(app).put("/api/task/123");
//     expect(res.body.message).toBe("Task updated");
//     expect(res.statusCode).toBe(200);

//     const getRes = await request(app).get("/api/task/123");
//     expect(getRes.statusCode).toBe(200);
//     expect(getRes.body).toEqual({
//       id: "123",
//       title: "Learn Jest",
//       completed: true,
//     });
//   });

//   it("Returns 404 on non-existent id", async () => {
//     await request(app).post("/api/task/add").send(mockData);

//     const res = await request(app).put("/api/task/1234");
//     expect(res.body.message).toBe("No task found");
//     expect(res.statusCode).toBe(404);
//   });
// });

// describe("DELETE /api/task/:id", () => {
//   it("Delete existing task and GET follow-up", async () => {
//     await request(app).post("/api/task/add").send(mockData);

//     const res = await request(app).delete("/api/task/123");
//     expect(res.statusCode).toBe(204);

//     const getRes = await request(app).get("/api/task/123");
//     expect(getRes.statusCode).toBe(404);
//     expect(getRes.body.message).toBe("No task found");
//   });

//   it("Non-existent task to delete", async () => {
//     await request(app).post("/api/task/add").send({
//       id: "125",
//       title: "Learn Jest",
//       completed: true,
//     });

//     const res = await request(app).delete("/api/task/126");
//     expect(res.statusCode).toBe(404);
//     expect(res.body.message).toBe("No task found");
//   });
// });
