import fs from "fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined
});

try {
  const sql = fs.readFileSync(
    new URL("./migrations/001_initial_schema.sql", import.meta.url),
    "utf8"
  );

  await pool.query(sql);
  console.log("Database migration completed successfully.");
} catch (error) {
  console.error("Database migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
