import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const isTest = process.env.NODE_ENV === "test";

export const pool = new Pool({
  user: isTest ? process.env.TEST_PG_USER : process.env.PG_USER,
  host: isTest ? process.env.TEST_PG_HOST : process.env.PG_HOST,
  password: isTest ? process.env.TEST_PG_PASSWORD : process.env.PG_PASSWORD,
  database: isTest ? process.env.TEST_PG_DB : process.env.PG_DB,
  port: isTest ? process.env.TEST_PG_PORT : process.env.PG_PORT,
  ssl: { rejectUnauthorized: true },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});
