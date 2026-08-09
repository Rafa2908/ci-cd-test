import { Router } from "express";
import {
  addTask,
  deleteTaskById,
  getTaskById,
  getTasks,
  getTasksCompleted,
  updateTaskStatus,
  updateTaskTitle,
} from "../controller/task.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

export const taskRouter = Router();

taskRouter.route("/add").post(authMiddleware, addTask);
taskRouter.route("/tasks").get(authMiddleware, getTasks);
taskRouter.route("/search").get(authMiddleware, getTasksCompleted);
taskRouter
  .route("/:id")
  .get(authMiddleware, getTaskById)
  .delete(authMiddleware, deleteTaskById);
taskRouter.route("/:id/title").put(authMiddleware, updateTaskTitle);
taskRouter.route("/:id/status").put(authMiddleware, updateTaskStatus);
