const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate, authorize('ADMIN'));

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.email as user_email 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.timestamp DESC LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
