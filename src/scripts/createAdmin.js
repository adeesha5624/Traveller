
require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('../db');

async function createAdmin() {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error('Admin name, email and password are required');
    }

    if (password.length < 12) {
      throw new Error('Password must contain at least 12 characters');
    }

    // Check whether the email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('An account with this email already exists');
      return;
    }

    // Hash the password before storing
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, name, email, role`,
      [name, email, passwordHash, 'admin']
    );

    if (result.rows.length === 0) {
      console.log('Admin email already exists');
      return;
    }

    console.log('Admin account created successfully!');
    console.log(result.rows[0]);

  } catch (error) {
    console.error('Admin creation failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createAdmin();
