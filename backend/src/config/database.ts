import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'company_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Set timezone for all connections
const timezone = process.env.DB_TIMEZONE || 'UTC';

pool.on('connect', async (client) => {
  try {
    // Set timezone for this connection
    await client.query(`SET timezone = '${timezone}'`);
    console.log(`Database connected successfully with timezone: ${timezone}`);
  } catch (err) {
    console.error('Error setting timezone:', err);
  }
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export default pool;
