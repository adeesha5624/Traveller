
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test API
app.get('/', (req, res) => {
  res.send('TRAVELLER Backend is Running!');
});

// Check database connection
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'success',
      database: 'connected',
    });
  } catch (error) {
    console.error('Database connection failed:', error);

    res.status(500).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});

// Get all camping and hiking places
app.get('/api/places', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM places ORDER BY name'
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching places:', error);

    res.status(500).json({
      message: 'Failed to fetch places',
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TRAVELLER Backend running on port ${PORT}`);
});
