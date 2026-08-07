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

export const taskRouter = Router();

taskRouter.route("/add").post(addTask);
taskRouter.route("/tasks").get(getTasks);
taskRouter.route("/search").get(getTasksCompleted);
taskRouter.route("/:id").get(getTaskById).delete(deleteTaskById);
taskRouter.route("/:id/title").put(updateTaskTitle);
taskRouter.route("/:id/status").put(updateTaskStatus);
