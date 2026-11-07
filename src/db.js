const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

module.exports = pool;

pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ PostgreSQL Connected Successfully!');
  })
  .catch((error) => {
    console.error('❌ PostgreSQL Connection Failed');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
  });