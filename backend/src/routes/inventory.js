const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { baseId, equipmentTypeId } = req.query;
    let query = `
      SELECT i.*, b.name as base_name, e.name as equipment_name 
      FROM inventory i
      JOIN bases b ON i.base_id = b.id
      JOIN equipment_types e ON i.equipment_type_id = e.id
      WHERE 1=1
    `;
    const params = [];

    const effectiveBaseId = req.user.role === 'ADMIN' ? (baseId || null) : req.user.base_id;
    if (effectiveBaseId) {
      query += ` AND i.base_id = ?`;
      params.push(effectiveBaseId);
    }
    if (equipmentTypeId) {
      query += ` AND i.equipment_type_id = ?`;
      params.push(equipmentTypeId);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Inventory Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
