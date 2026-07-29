import { Router } from "express";
import {
  addTask,
  deleteTaskById,
  getTaskById,
  getTasks,
  getTasksCompleted,
  updateTaskById,
} from "../controller/task.controller.js";

export const taskRouter = Router();

taskRouter.route("/add").post(addTask);
taskRouter.route("/tasks").get(getTasks);
taskRouter.route("/search").get(getTasksCompleted);
taskRouter
  .route("/:id")
  .get(getTaskById)
  .put(updateTaskById)
  .delete(deleteTaskById);
