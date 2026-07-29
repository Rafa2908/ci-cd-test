export const errorHandler = (error, req, res) => {
  console.log("Error:", error);

  return res.status(500).json({ message: "Internal server error" });
};
