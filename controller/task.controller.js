import { pool } from "../config/database.js";

export const addTask = async (req, res, next) => {
  const { title } = req.body;

  try {
    if (!title) {
      return res.status(400).json({ message: "No data provided" });
    }

    const newTask = await pool.query(
      `
      INSERT INTO tasks(title)
      VALUES($1)
      `,
      [title],
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
  try {
    const tasks = await pool.query(`
      SELECT id, title, completed FROM tasks
      `);

    if (tasks.rowCount === 0) {
      return res.status(200).json({ message: "No tasks available", tasks: [] });
    }

    return res.status(200).json({ tasks: tasks.rows });
  } catch (error) {
    return next(error);
  }
};

export const getTaskById = async (req, res, next) => {
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
      WHERE id=$1
      `,
      [id],
    );

    if (task.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ task: task.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const getTasksCompleted = async (req, res, next) => {
  const { completed } = req.query;
  try {
    const task = await pool.query(
      `
      SELECT title
      FROM tasks
      WHERE completed=$1
      `,
      [completed],
    );

    if (task.rowCount === 0) {
      return res.status(404).json({ message: "Tasks not found" });
    }

    return res.status(200).json({ tasks: task.rows[0] });
  } catch (error) {
    return next(error);
  }
};

// export const updateTaskById = async (req, res, next) => {
//   const { id } = req.params;

//   try {
//     const task = tasks.find((t) => t.id === id);

//     if (!task) {
//       return res.status(404).json({ message: "No task found" });
//     }

//     if (task.completed === true) {
//       task.completed = false;
//     } else {
//       task.completed = true;
//     }

//     return res.status(200).json({ message: "Task updated" });
//   } catch (error) {
//     return next(error);
//   }
// };

// export const deleteTaskById = async (req, res, next) => {
//   const { id } = req.params;

//   try {
//     const i = tasks.findIndex((t) => t.id === id);

//     if (i === -1) {
//       return res.status(404).json({ message: "No task found" });
//     }

//     tasks.splice(i, 1);

//     return res.status(204).send();
//   } catch (error) {
//     return next(error);
//   }
// };
