import express from "express";
import { taskRouter } from "./routes/task.route.js";
import { errorHandler } from "./middleware/error.middleware.js";

export const app = express();

app.use(express.json());

app.use("/api/task", taskRouter);
app.use(errorHandler);

const port = process.env.PORT;

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
  });
}
