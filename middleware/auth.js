import jwt from "jsonwebtoken";
import { hashToken } from "./utils/hashToken.js";
import { pool } from "../config/database.js";
import "dotenv/config";

const authMiddleware = async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;

  const currentTime = new Date();

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
      req.user = decoded;
      return next();
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized. Login again." });
    }
  }

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized, Login again.",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, role: decoded.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, role: decoded.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    const oldHashedToken = hashToken(refreshToken);
    const hashedRefreshToken = hashToken(newRefreshToken);

    const storedStoken = await pool.query(
      `
      UPDATE refresh_token
      SET token_hash=$1, expires_at=NOW() + INTERVAL '7 days'
      WHERE user_id=$2 AND token_hash=$3 AND expires_at > $4
      RETURNING id
      `,
      [hashedRefreshToken, decoded.userId, oldHashedToken, currentTime],
    );

    if (storedStoken.rowCount === 0) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    req.user = decoded;
    return next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Not Authorized, Login again." });
  }
};

export default authMiddleware;
