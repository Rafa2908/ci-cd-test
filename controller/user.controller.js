import { pool } from "../config/database.js";
import { hashToken } from "../utils/hashToken.js";
import { emailValidator, passwordValidator } from "../utils/regex.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

export const registerUSer = async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  let inTransction = false;
  let client;

  try {
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: "No data provided" });
    }

    if (!emailValidator(email)) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }

    if (!passwordValidator(password)) {
      return res.status(400).json({
        message:
          "Password must be 8 characters long and at least have 1 uppercase, 1 lowercase, 1 number, and 1 special character",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    inTransction = true;

    const userExist = await client.query(
      `
      SELECT id FROM users
      WHERE email=$1
      `,
      [email],
    );

    if (userExist.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await client.query(
      `
      INSERT INTO users(email, password)
      VALUES($1, $2)
      RETURNING id, email
      `,
      [email, hashedPassword],
    );

    if (newUser.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Unable to register user. Try again" });
    }

    const refreshToken = jwt.sign(
      {
        userId: newUser.rows[0].id,
        email: newUser.rows[0].email,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    const accessToken = jwt.sign(
      {
        userId: newUser.rows[0].id,
        email: newUser.rows[0].email,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    const hashedToken = hashToken(refreshToken);

    await client.query(
      `
      INSERT INTO refresh_token(user_id, token_hash, expires_at)
      VALUES($1, $2, NOW() + INTERVAL '7 days')
      ON CONFLICT (user_id)
      DO UPDATE SET token_hash=EXCLUDED.token_hash, expires_at=EXCLUDED.expires_at
      `,
      [newUser.rows[0].id, hashedToken],
    );

    await client.query("COMMIT");
    inTransction = false;

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(201)
      .json({ message: "User registered successfully", user: newUser.rows[0] });
  } catch (error) {
    if (inTransction) {
      await client.query("ROLLBACK");
    }
    return next(error);
  } finally {
    if (client) {
      await client.release();
    }
  }
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide credentials to log in" });
    }

    if (!emailValidator(email)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!passwordValidator(password)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = await pool.query(
      `
      SELECT id, password FROM users
      WHERE email=$1
      `,
      [email],
    );

    if (user.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.compare(
      password,
      user.rows[0].password,
    );

    if (!hashedPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const refreshToken = jwt.sign(
      { userId: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    const accessToken = jwt.sign(
      { userId: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    const hashedToken = hashToken(refreshToken);

    await pool.query(
      `
      INSERT INTO refresh_token(user_id, token_hash, expires_at)
      VALUES($1, $2, NOW() + INTERVAL '7 days')
      ON CONFLICT (user_id)
      DO UPDATE SET token_hash=EXCLUDED.token_hash, expires_at=EXCLUDED.expires_at
      `,
      [user.rows[0].id, hashedToken],
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Logged in successfully",
      user: { id: user.rows[0].id, email: email },
    });
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  const { userId } = req.user;

  try {
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

    const clearToken = await pool.query(
      `
      DELETE FROM refresh_token
      WHERE user_id=$1
      RETURNING id
      `,
      [userId],
    );

    if (clearToken.rowCount === 0) {
      return res.status(404).json({ message: "Unable to find token" });
    }

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    return next(error);
  }
};
