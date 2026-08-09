import { pool } from "../config/database.js";

export const addTask = async (req, res, next) => {
  const { userId } = req.user;
  const { title } = req.body;

  try {
    if (!title) {
      return res.status(400).json({ message: "No data provided" });
    }

    const newTask = await pool.query(
      `
      INSERT INTO tasks(title, user_id)
      VALUES($1, $2)
      `,
      [title, userId],
    );

    if (newTask.rowCount === 0) {
      return res.status(400).json({ message: "Error adding new task" });
    }

    return res.status(201).json({ message: "New task added" });
  } catch (error) {
    return next(error);
  }
};

export const getTasks = async (req, res, next) => {
  const { userId } = req.user;
  try {
    const tasks = await pool.query(
      `
      SELECT id, title, completed FROM tasks
      WHERE user_id=$1
      `,
      [userId],
    );

    if (tasks.rowCount === 0) {
      return res.status(200).json({ message: "No tasks available", tasks: [] });
    }

    return res.status(200).json({ tasks: tasks.rows });
  } catch (error) {
    return next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    if (!id || id.trim() === "") {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    const task = await pool.query(
      `
      SELECT id, title, completed
      FROM tasks
      WHERE id=$1 AND user_id=$2
      `,
      [id, userId],
    );

    if (task.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(task.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const getTasksCompleted = async (req, res, next) => {
  const { userId } = req.user;
  const { completed } = req.query;
  try {
    const task = await pool.query(
      `
      SELECT title
      FROM tasks
      WHERE completed=$1 AND user_id=$2
      `,
      [completed, userId],
    );

    if (task.rowCount === 0) {
      return res.status(404).json({ message: "Tasks not found" });
    }

    return res.status(200).json({ tasks: task.rows });
  } catch (error) {
    return next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  const { userId } = req.user;
  const { id } = req.params;
  try {
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    const update = await pool.query(
      `
      UPDATE tasks
      SET completed = NOT completed
      WHERE id=$1 AND user_id=$2
      RETURNING id
      `,
      [id, userId],
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ message: "No task found to complete" });
    }

    return res.status(200).json({ message: "Task completed" });
  } catch (error) {
    return next(error);
  }
};

export const updateTaskTitle = async (req, res, next) => {
  const { id } = req.params;
  const { title } = req.body;
  const { userId } = req.user;

  try {
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    if (!title) {
      return res.status(400).json({ message: "No data provided" });
    }

    const update = await pool.query(
      `
      UPDATE tasks
      SET title=$1
      WHERE id=$2 AND user_id=$3
      RETURNING id
      `,
      [title, id, userId],
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ message: "No task found to update" });
    }

    return res.status(200).json({ message: "Task updated" });
  } catch (error) {
    return next(error);
  }
};

export const deleteTaskById = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    const deleteTask = await pool.query(
      `
      DELETE FROM tasks
      WHERE id=$1 AND user_id=$2
      RETURNING id
      `,
      [id, userId],
    );

    if (deleteTask.rowCount === 0) {
      return res.status(404).json({ message: "No task found to delete" });
    }

    return res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    return next(error);
  }
};
