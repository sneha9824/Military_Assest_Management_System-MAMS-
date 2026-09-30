const pool = require('../config/db');

exports.createAssignment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { base_id, equipment_type_id, personnel_name, quantity, assignment_date, remarks } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'ADMIN' && req.user.base_id != base_id) {
      return res.status(403).json({ error: 'Forbidden: You can only assign assets for your assigned base.' });
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

    // 2. Deduct from inventory
    await connection.query(
      'UPDATE inventory SET current_balance = current_balance - ?, version = version + 1 WHERE base_id = ? AND equipment_type_id = ?',
      [quantity, base_id, equipment_type_id]
    );

    // 3. Record assignment
    const [result] = await connection.query(
      `INSERT INTO assignments (base_id, equipment_type_id, personnel_name, quantity, assignment_date, status, assigned_by, remarks)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      [base_id, equipment_type_id, personnel_name, quantity, assignment_date, userId, remarks]
    );

    await connection.commit();
    req.auditEntityId = result.insertId;
    res.status(201).json({ message: 'Assignment created successfully', assignment_id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Assignment Error:', error);
    res.status(500).json({ error: 'Internal server error during assignment' });
  } finally {
    connection.release();
  }
};

exports.returnAssignment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const assignmentId = req.params.id;

    await connection.beginTransaction();

    const [assignments] = await connection.query(
      'SELECT base_id, equipment_type_id, quantity, status FROM assignments WHERE id = ? FOR UPDATE',
      [assignmentId]
    );

    if (assignments.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const assignment = assignments[0];

    if (req.user.role !== 'ADMIN' && req.user.base_id != assignment.base_id) {
      await connection.rollback();
      return res.status(403).json({ error: 'Forbidden.' });
    }

    if (assignment.status !== 'ACTIVE') {
      await connection.rollback();
      return res.status(400).json({ error: 'Assignment is already returned or cancelled.' });
    }

    // Restore inventory
    await connection.query(
      'UPDATE inventory SET current_balance = current_balance + ?, version = version + 1 WHERE base_id = ? AND equipment_type_id = ?',
      [assignment.quantity, assignment.base_id, assignment.equipment_type_id]
    );

    // Update assignment status
    await connection.query(
      'UPDATE assignments SET status = "RETURNED" WHERE id = ?',
      [assignmentId]
    );

    await connection.commit();
    res.json({ message: 'Assignment returned successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Return Assignment Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    connection.release();
  }
};
exports.getAssignments = async (req, res) => {
  try {
    const { from, to, baseId, equipmentTypeId } = req.query;
    
    let query = `
      SELECT a.*, 
        b.name as base_name, 
        e.name as equipment_name,
        u.name as assigner_name
      FROM assignments a
      JOIN bases b ON a.base_id = b.id
      JOIN equipment_types e ON a.equipment_type_id = e.id
      JOIN users u ON a.assigned_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (from && to) {
      query += ` AND a.assignment_date BETWEEN ? AND ?`;
      params.push(from, to);
    }
    if (equipmentTypeId) {
      query += ` AND a.equipment_type_id = ?`;
      params.push(equipmentTypeId);
    }

    const effectiveBaseId = req.user.role === 'ADMIN' ? (baseId || null) : req.user.base_id;
    if (effectiveBaseId) {
      query += ` AND a.base_id = ?`;
      params.push(effectiveBaseId);
    }

    query += ` ORDER BY a.assignment_date DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get Assignments Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
