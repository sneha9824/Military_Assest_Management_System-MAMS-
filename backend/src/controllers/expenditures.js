const pool = require('../config/db');

exports.createExpenditure = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { base_id, equipment_type_id, quantity, expenditure_date, reason, reference_number, remarks } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'ADMIN' && req.user.base_id != base_id) {
      return res.status(403).json({ error: 'Forbidden: You can only record expenditures for your assigned base.' });
    }

    await connection.beginTransaction();

    // 1. Check inventory
    const [inv] = await connection.query(
      'SELECT current_balance FROM inventory WHERE base_id = ? AND equipment_type_id = ? FOR UPDATE',
      [base_id, equipment_type_id]
    );

    if (inv.length === 0 || parseFloat(inv[0].current_balance) < parseFloat(quantity)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Insufficient stock.' });
    }

    // 2. Deduct from inventory (Expenditure permanently removes it)
    await connection.query(
      'UPDATE inventory SET current_balance = current_balance - ?, version = version + 1 WHERE base_id = ? AND equipment_type_id = ?',
      [quantity, base_id, equipment_type_id]
    );

    // 3. Record expenditure
    const [result] = await connection.query(
      `INSERT INTO expenditures (base_id, equipment_type_id, quantity, expenditure_date, reason, reference_number, remarks, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [base_id, equipment_type_id, quantity, expenditure_date, reason, reference_number, remarks, userId]
    );

    await connection.commit();
    req.auditEntityId = result.insertId;
    res.status(201).json({ message: 'Expenditure recorded successfully', expenditure_id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Expenditure Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
       return res.status(400).json({ error: 'Reference number must be unique' });
    }
    res.status(500).json({ error: 'Internal server error during expenditure' });
  } finally {
    connection.release();
  }
};
exports.getExpenditures = async (req, res) => {
  try {
    const { from, to, baseId, equipmentTypeId } = req.query;
    
    let query = `
      SELECT e.*, 
        b.name as base_name, 
        eq.name as equipment_name,
        u.name as recorder_name
      FROM expenditures e
      JOIN bases b ON e.base_id = b.id
      JOIN equipment_types eq ON e.equipment_type_id = eq.id
      JOIN users u ON e.recorded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (from && to) {
      query += ` AND e.expenditure_date BETWEEN ? AND ?`;
      params.push(from, to);
    }
    if (equipmentTypeId) {
      query += ` AND e.equipment_type_id = ?`;
      params.push(equipmentTypeId);
    }

    const effectiveBaseId = req.user.role === 'ADMIN' ? (baseId || null) : req.user.base_id;
    if (effectiveBaseId) {
      query += ` AND e.base_id = ?`;
      params.push(effectiveBaseId);
    }

    query += ` ORDER BY e.expenditure_date DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get Expenditures Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
