
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM public.users
       WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const isValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      {
        sub: String(user.id),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
        algorithm: 'HS256',
      }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Unable to login',
    });
  }
};

module.exports = { login };
