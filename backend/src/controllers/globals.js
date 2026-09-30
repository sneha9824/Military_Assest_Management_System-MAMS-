const pool = require('../config/db');

exports.getBases = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bases WHERE active = TRUE');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createBase = async (req, res) => {
  try {
    const { name, code } = req.body;
    const [result] = await pool.query('INSERT INTO bases (name, code, active) VALUES (?, ?, TRUE)', [name, code || name.substring(0, 3).toUpperCase()]);
    res.json({ id: result.insertId, name, code: code || name.substring(0, 3).toUpperCase() });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteBase = async (req, res) => {
  try {
    await pool.query('UPDATE bases SET active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getEquipmentTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM equipment_types WHERE active = TRUE');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createEquipmentType = async (req, res) => {
  try {
    const { name, category } = req.body;
    const [result] = await pool.query('INSERT INTO equipment_types (name, category, unit, active) VALUES (?, ?, "pcs", TRUE)', [name, category || name]);
    res.json({ id: result.insertId, name, category: category || name, unit: "pcs" });
  } catch (error) {
    console.error('Failed to insert equipment type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteEquipmentType = async (req, res) => {
  try {
    await pool.query('UPDATE equipment_types SET active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
