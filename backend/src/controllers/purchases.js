const pool = require('../config/db');

exports.createPurchase = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { base_id, equipment_type_id, quantity, purchase_date, supplier, reference_number, remarks } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'ADMIN' && req.user.base_id != base_id) {
      return res.status(403).json({ error: 'Forbidden: You can only create purchases for your assigned base.' });
    }

    await connection.beginTransaction();

    // 1. Record purchase
    const [result] = await connection.query(
      `INSERT INTO purchases (base_id, equipment_type_id, quantity, purchase_date, supplier, reference_number, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [base_id, equipment_type_id, quantity, purchase_date, supplier, reference_number, remarks, userId]
    );

    // 2. Add to inventory (insert if doesn't exist)
    const [inv] = await connection.query(
      'SELECT id FROM inventory WHERE base_id = ? AND equipment_type_id = ? FOR UPDATE',
      [base_id, equipment_type_id]
    );

    if (inv.length === 0) {
      await connection.query(
        'INSERT INTO inventory (base_id, equipment_type_id, opening_balance, current_balance) VALUES (?, ?, 0, ?)',
        [base_id, equipment_type_id, quantity]
      );
    } else {
      await connection.query(
        'UPDATE inventory SET current_balance = current_balance + ?, version = version + 1 WHERE base_id = ? AND equipment_type_id = ?',
        [quantity, base_id, equipment_type_id]
      );
    }

    await connection.commit();
    req.auditEntityId = result.insertId;
    res.status(201).json({ message: 'Purchase successful', purchase_id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Purchase Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
       return res.status(400).json({ error: 'Reference number must be unique' });
    }
    res.status(500).json({ error: 'Internal server error during purchase' });
  } finally {
    connection.release();
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const { from, to, baseId, equipmentTypeId } = req.query;
    
    let query = `
      SELECT p.*, 
        b.name as base_name, 
        e.name as equipment_name,
        u.name as creator_name
      FROM purchases p
      JOIN bases b ON p.base_id = b.id
      JOIN equipment_types e ON p.equipment_type_id = e.id
      JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (from && to) {
      query += ` AND p.purchase_date BETWEEN ? AND ?`;
      params.push(from, to);
    }
    if (equipmentTypeId) {
      query += ` AND p.equipment_type_id = ?`;
      params.push(equipmentTypeId);
    }

    const effectiveBaseId = req.user.role === 'ADMIN' ? (baseId || null) : req.user.base_id;
    if (effectiveBaseId) {
      query += ` AND p.base_id = ?`;
      params.push(effectiveBaseId);
    }

    query += ` ORDER BY p.purchase_date DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get Purchases Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
