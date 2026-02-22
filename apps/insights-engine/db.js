import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("error", (err) => {
  console.error("❌ Unexpected pool error:", err.message);
});

async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT current_database(), NOW()");
    const dbName = res.rows[0].current_database;
    const ts = res.rows[0].now;
    console.log(`✅ Database connected: ${dbName} at ${ts}`);
    return true;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

export { pool, testConnection };
