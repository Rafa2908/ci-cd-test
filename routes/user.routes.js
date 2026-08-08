import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUSer,
} from "../controller/user.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

export const userRouter = Router();

userRouter.route("/register").post(registerUSer);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(authMiddleware, logoutUser);
