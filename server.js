import express from "express";
import cookieParser from "cookie-parser";
import { taskRouter } from "./routes/task.route.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { userRouter } from "./routes/user.routes.js";

export const app = express();

app.use(cookieParser());
app.use(express.json());

app.use("/api/task", taskRouter);
app.use("/api/user", userRouter);
app.use(errorHandler);

const port = process.env.PORT;

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
  });
}
