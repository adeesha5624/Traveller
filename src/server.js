
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
require('dotenv').config();

const {
  authenticate,
  requireAdmin
} = require('./middleware/auth.middleware');

const pool = require('./db');

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

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
    const result = await pool.query(`
  SELECT
    id,
    name,
    district,
    category,
    difficulty,
    image,
    description,
    water_available AS "waterAvailable",
    campfire_allowed AS "campfireAllowed",
    vehicle_access AS "vehicleAccess",
    permit_required AS "permitRequired",
    highlights,
    json_build_object(
      'latitude', latitude,
      'longitude', longitude
    ) AS coordinates
  FROM places
  ORDER BY name
`);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching places:', error);

    res.status(500).json({
      message: 'Failed to fetch places',
    });
  }
});


app.post('/api/places',authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      id,
      name,
      district,
      category,
      difficulty,
      description,
      latitude,
      longitude
    } = req.body;

    // Validate required fields
    if (
      !id || !name || !district ||
      !category || !difficulty ||
      !description ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        message: 'Missing or invalid required fields'
      });
    }

    const result = await pool.query(
      `INSERT INTO places
       (id, name, district, category, difficulty,
        description, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id, name, district, category, difficulty,
        description, latitude, longitude
      ]
    );

    res.status(201).json({
      message: 'Place added successfully',
      place: result.rows[0]
    });

  } catch (error) {
    console.error('Create place error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Place ID already exists'
      });
    }

    res.status(500).json({
      message: 'Failed to create place'
    });
  }
});


app.put('/api/places/:id',authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      district,
      category,
      difficulty,
      description,
      latitude,
      longitude
    } = req.body ?? {};

    // Validate required fields
    if (
      typeof name !== 'string' || !name.trim() ||
      typeof district !== 'string' || !district.trim() ||
      !['Camping', 'Hiking', 'Viewpoint'].includes(category) ||
      !['Easy', 'Moderate', 'Hard'].includes(difficulty) ||
      typeof description !== 'string' || !description.trim() ||
      typeof latitude !== 'number' ||
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      typeof longitude !== 'number' ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    ) {
      return res.status(400).json({
        message: 'Invalid or missing place information'
      });
    }

    const result = await pool.query(
      `UPDATE places
       SET name = $1,
           district = $2,
           category = $3,
           difficulty = $4,
           description = $5,
           latitude = $6,
           longitude = $7
       WHERE id = $8
       RETURNING *`,
      [
        name.trim(),
        district.trim(),
        category,
        difficulty,
        description.trim(),
        latitude,
        longitude,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Place not found'
      });
    }

    res.status(200).json({
      message: 'Place updated successfully',
      place: result.rows[0]
    });

  } catch (error) {
    console.error('Update place error:', error);

    res.status(500).json({
      message: 'Failed to update place'
    });
  }
});


app.delete('/api/places/:id',authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM places
       WHERE id = $1
       RETURNING id, name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Place not found'
      });
    }

    return res.status(200).json({
      message: 'Place deleted successfully',
      deletedPlace: result.rows[0]
    });

  } catch (error) {
    console.error('Delete place error:', error);

    return res.status(500).json({
      message: 'Failed to delete place'
    });
  }
});


app.get('/api/listings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        l.id,
        l.title,
        l.description,
        l.category,
        l.listing_type AS "listingType",
        l.price,
        l.price_unit AS "priceUnit",
        l.district,
        l.image_url AS "imageUrl",
        p.business_name AS "providerName",
        p.phone_number AS "phoneNumber",
        p.whatsapp_number AS "whatsappNumber"
      FROM public.listings l
      JOIN public.provider_profiles p
        ON p.id = l.provider_id
      WHERE l.approval_status = 'approved'
        AND p.approval_status = 'approved'
        AND l.is_available = TRUE
      ORDER BY l.created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Listings API error:', error);
    res.status(500).json({
      message: 'Unable to load listings'
    });
  }
});



// Start server
const PORT = Number(process.env.PORT) || 5050;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`TRAVELLER Backend running on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Server listening error:', error);
});
