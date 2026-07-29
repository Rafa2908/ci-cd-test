export const tasks = [];

export const addTask = async (req, res) => {
  const { id, title, completed } = req.body;

  try {
    if (!id || !title || completed === undefined) {
      return res.status(400).json({ message: "No data provided" });
    }

    const newTask = {
      id,
      title,
      completed: completed,
    };

    tasks.push(newTask);

    return res.status(201).json({ message: "New task added", task: newTask });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTasks = async (req, res) => {
  try {
    if (tasks.length === 0) {
      return res.status(200).json({ tasks: [] });
    }
    return res.status(200).json({ tasks: tasks });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTaskById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    const task = tasks.find((t) => t.id === id);

    if (!task) {
      return res.status(404).json({ message: "No task found" });
    }

    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTasksCompleted = async (req, res) => {
  const { completed } = req.query;
  try {
    if (completed !== "true") {
      return res.status(404).json({ message: "No task completed found" });
    }

    const taskCompleted = tasks.filter((t) => t.completed === true);

    if (taskCompleted.length === 0) {
      return res.status(404).json({ message: "No task completed found" });
    }

    return res.status(200).json({ tasks: taskCompleted });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTaskById = async (req, res) => {
  const { id } = req.params;

  try {
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      return res.status(404).json({ message: "No task found" });
    }

    if (task.completed === true) {
      task.completed = false;
    } else {
      task.completed = true;
    }

    return res.status(200).json({ message: "Task updated" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteTaskById = async (req, res) => {
  const { id } = req.params;

  try {
    const i = tasks.findIndex((t) => t.id === id);

    if (i === -1) {
      return res.status(404).json({ message: "No task found" });
    }

    tasks.splice(i, 1);

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
