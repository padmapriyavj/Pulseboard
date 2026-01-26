const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5433,
  database: process.env.PG_DATABASE || 'pulseboard',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'admin',
});

module.exports = pool;
