import { Router } from "express";
import { registerUSer } from "../controller/user.controller.js";

export const userRouter = Router();

userRouter.route("/register").post(registerUSer);
