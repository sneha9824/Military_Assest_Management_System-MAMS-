const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate, authorize('ADMIN'));

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.active, b.name as base_name 
      FROM users u 
      LEFT JOIN bases b ON u.base_id = b.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
