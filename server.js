import express from "express";
import { taskRouter } from "./routes/task.route.js";

export const app = express();

app.use(express.json());

app.use("/api/task", taskRouter);

const port = 8000;

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
  });
}
