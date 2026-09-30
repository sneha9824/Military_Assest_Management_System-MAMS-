const pool = require('../config/db');

exports.createTransfer = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { source_base_id, destination_base_id, equipment_type_id, quantity, reference_number, remarks } = req.body;
    const userId = req.user.id;

    // RBAC base check for non-admins
    if (req.user.role !== 'ADMIN' && req.user.base_id != source_base_id) {
      return res.status(403).json({ error: 'Forbidden: You can only transfer assets out of your assigned base.' });
    }

    if (source_base_id === destination_base_id) {
      return res.status(400).json({ error: 'Source and destination bases must differ.' });
    }

    await connection.beginTransaction();

    // 1. Check source inventory using FOR UPDATE to lock the row
    const [sourceInv] = await connection.query(
      'SELECT current_balance FROM inventory WHERE base_id = ? AND equipment_type_id = ? FOR UPDATE',
      [source_base_id, equipment_type_id]
    );

    if (sourceInv.length === 0 || parseFloat(sourceInv[0].current_balance) < parseFloat(quantity)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Insufficient stock at source base.' });
    }

    // 2. Deduct from source base
    await connection.query(
      'UPDATE inventory SET current_balance = current_balance - ?, version = version + 1 WHERE base_id = ? AND equipment_type_id = ?',
      [quantity, source_base_id, equipment_type_id]
    );

    // 3. Add to destination base (insert if doesn't exist)
    const [destInv] = await connection.query(
      'SELECT id FROM inventory WHERE base_id = ? AND equipment_type_id = ? FOR UPDATE',
      [destination_base_id, equipment_type_id]
    );

    if (destInv.length === 0) {
      await connection.query(
        'INSERT INTO inventory (base_id, equipment_type_id, opening_balance, current_balance) VALUES (?, ?, 0, ?)',
        [destination_base_id, equipment_type_id, quantity]
      );
    } else {
      await connection.query(
        'UPDATE inventory SET current_balance = current_balance + ?, version = version + 1 WHERE base_id = ? AND equipment_type_id = ?',
        [quantity, destination_base_id, equipment_type_id]
      );
    }

    // 4. Record transfer
    const [result] = await connection.query(
      `INSERT INTO transfers (source_base_id, destination_base_id, equipment_type_id, quantity, status, reference_number, remarks, created_by)
       VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, ?)`,
      [source_base_id, destination_base_id, equipment_type_id, quantity, reference_number, remarks, userId]
    );

    await connection.commit();
    req.auditEntityId = result.insertId;
    res.status(201).json({ message: 'Transfer successful', transfer_id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Transfer Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
       return res.status(400).json({ error: 'Reference number must be unique' });
    }
    res.status(500).json({ error: 'Internal server error during transfer' });
  } finally {
    connection.release();
  }
};

exports.getTransfers = async (req, res) => {
  try {
    const { from, to, baseId, equipmentTypeId, direction } = req.query;
    let query = `
      SELECT t.*, 
        sb.name as source_base_name, 
        db.name as destination_base_name, 
        e.name as equipment_name,
        u.name as creator_name
      FROM transfers t
      JOIN bases sb ON t.source_base_id = sb.id
      JOIN bases db ON t.destination_base_id = db.id
      JOIN equipment_types e ON t.equipment_type_id = e.id
      JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (from && to) {
      query += ` AND DATE(t.transfer_date) BETWEEN ? AND ?`;
      params.push(from, to);
    }

    if (equipmentTypeId) {
      query += ` AND t.equipment_type_id = ?`;
      params.push(equipmentTypeId);
    }

    // Apply base filtering
    // If user is not admin, force their base filter
    const effectiveBaseId = req.user.role === 'ADMIN' ? (baseId || null) : req.user.base_id;

    if (effectiveBaseId) {
      if (direction === 'in') {
        query += ` AND t.destination_base_id = ?`;
        params.push(effectiveBaseId);
      } else if (direction === 'out') {
        query += ` AND t.source_base_id = ?`;
        params.push(effectiveBaseId);
      } else {
        query += ` AND (t.source_base_id = ? OR t.destination_base_id = ?)`;
        params.push(effectiveBaseId, effectiveBaseId);
      }
    }

    query += ` ORDER BY t.transfer_date DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get Transfers Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
