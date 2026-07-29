import request from "supertest";
import { app } from "../server.js";
import { tasks } from "../controller/task.controller.js";

beforeEach(() => {
  tasks.length = 0;
});

const mockData = { id: "123", title: "Learn Jest", completed: false };

describe("GET /api/task/tasks", () => {
  it("Returns empty array and success 200", async () => {
    const res = await request(app).get("/api/task/tasks");
    expect(res.body.tasks.length).toBe(0);
    expect(res.statusCode).toBe(200);
  });

  it("Returns tasks array and success 200", async () => {
    await request(app).post("/api/task/add").send({
      id: "123",
      title: "Learn Jest",
      completed: false,
    });
    await request(app).post("/api/task/add").send({
      id: "124",
      title: "Learn CI/CD",
      completed: false,
    });

    const res = await request(app).get("/api/task/tasks");
    expect(res.body.tasks.length).toBe(2);
    expect(res.statusCode).toBe(200);
  });
});

describe("GET /api/task/:id", () => {
  it("Returns the matching task and success 200", async () => {
    await request(app).post("/api/task/add").send({
      id: "123",
      title: "Learn Jest",
      completed: false,
    });

    const res = await request(app).get("/api/task/123");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: "123",
      title: "Learn Jest",
      completed: false,
    });
  });

  it("Returns 404 for an unknown id", async () => {
    const res = await request(app).get("/api/task/doesnotexist");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No task found");
  });
});

describe("POST /api/task/add", () => {
  it("No data provided", async () => {
    const res = await request(app).post("/api/task/add").send({
      id: "",
      title: "",
      completed: undefined,
    });
    expect(res.body.message).toBe("No data provided");
    expect(res.statusCode).toBe(400);
  });

  it("Adding new task", async () => {
    const res = await request(app).post("/api/task/add").send({
      id: "123",
      title: "Learning Jest",
      completed: false,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("New task added");
    expect(res.body.task).toEqual({
      id: "123",
      title: "Learning Jest",
      completed: false,
    });
  });
});

describe("GET /api/task/search?completed=true", () => {
  it("Returns 404 if no completed task found", async () => {
    await request(app).post("/api/task/add").send(mockData);

    const res = await request(app).get("/api/task/search?completed=false");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No task completed found");
  });

  it("Returns completed tasks and success 200", async () => {
    await request(app).post("/api/task/add").send(mockData);
    await request(app).post("/api/task/add").send({
      id: "124",
      title: "Learn CI/CD",
      completed: true,
    });

    const res = await request(app).get("/api/task/search?completed=true");
    expect(res.statusCode).toBe(200);
    expect(res.body.tasks).toEqual([
      { id: "124", title: "Learn CI/CD", completed: true },
    ]);
  });
});

describe("PUT /api/task/:id", () => {
  it("Update task to true and returns the task", async () => {
    await request(app).post("/api/task/add").send(mockData);

    const res = await request(app).put("/api/task/123");
    expect(res.body.message).toBe("Task updated");
    expect(res.statusCode).toBe(200);

    const getRes = await request(app).get("/api/task/123");
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body).toEqual({
      id: "123",
      title: "Learn Jest",
      completed: true,
    });
  });

  it("Returns 404 on non-existent id", async () => {
    await request(app).post("/api/task/add").send(mockData);

    const res = await request(app).put("/api/task/1234");
    expect(res.body.message).toBe("No task found");
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /api/task/:id", () => {
  it("Delete existing task and GET follow-up", async () => {
    await request(app).post("/api/task/add").send(mockData);

    const res = await request(app).delete("/api/task/123");
    expect(res.statusCode).toBe(204);

    const getRes = await request(app).get("/api/task/123");
    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.message).toBe("No task found");
  });

  it("Non-existent task to delete", async () => {
    await request(app).post("/api/task/add").send({
      id: "125",
      title: "Learn Jest",
      completed: true,
    });

    const res = await request(app).delete("/api/task/126");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No task found");
  });
});
