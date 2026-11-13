
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Verify JWT token and load the current user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const token = authHeader.slice(7);

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        message: 'Invalid authentication'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );

    if (
      !decoded ||
      typeof decoded !== 'object' ||
      !decoded.sub
    ) {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, role
       FROM public.users
       WHERE id = $1`,
      [decoded.sub]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'User no longer exists'
      });
    }

    req.user = result.rows[0];

    next();
  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        message: 'Invalid or expired token'
      });
    }

    console.error('Authentication error:', error);

    return res.status(500).json({
      message: 'Authentication failed'
    });
  }
};

// Check whether authenticated user is an admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required'
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireAdmin
};
