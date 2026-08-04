export const errorHandler = (error, req, res, _next) => {
  console.log("Error:", error);

  return res.status(500).json({ message: "Internal server error" });
};
