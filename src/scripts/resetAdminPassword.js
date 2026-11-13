
require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('../db');

async function resetAdminPassword() {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password || password.length < 12) {
      throw new Error(
        'Admin email and a password of at least 12 characters are required'
      );
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `UPDATE public.users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE LOWER(email) = $2
         AND role = 'admin'
       RETURNING id, email, role`,
      [hash, email]
    );

    if (result.rows.length === 0) {
      console.log('No matching admin account found');
      return;
    }

    console.log('Admin password updated successfully');
  } catch (error) {
    console.error('Password reset failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
